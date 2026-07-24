"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEmailConfig, sendEmail, buildBindMailHtml } from "@/lib/email";
import { generateCode, saveCode, canSend, verifyCode } from "@/lib/email-store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 发送「绑定 / 换绑邮箱」验证码到新邮箱（需登录）。
 * 校验：格式、不可与他人重复、不可与原邮箱相同、发送频率。
 */
export async function sendBindEmailCode(
  newEmail: string,
): Promise<{ error?: string; ok?: boolean; debugCode?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };

  const email = (newEmail || "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return { error: "请输入正确的邮箱" };

  // 不可被其他账号占用
  const duplicate = await prisma.user.findFirst({
    where: { email, NOT: { id: session.user.id } },
  });
  if (duplicate) return { error: "该邮箱已被其他账号使用" };

  // 不可与原邮箱相同
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });
  if (me?.email && me.email.toLowerCase() === email) {
    return { error: "新邮箱不能与原邮箱相同" };
  }

  // 发送频率
  const cooldown = canSend(email);
  if (!cooldown.ok) {
    return { error: `发送过于频繁，请 ${cooldown.waitSeconds} 秒后再试` };
  }

  const code = generateCode();
  saveCode(email, code);

  const cfg = await getEmailConfig();
  const result = await sendEmail({
    to: email,
    subject: "厦门培训网 · 绑定邮箱验证码",
    html: buildBindMailHtml(code),
    text: `您的绑定邮箱验证码是：${code}（5 分钟内有效）。如非本人操作请忽略。`,
  });

  if (!result.success) {
    console.error(`[EMAIL] 绑定邮件发送失败: ${result.error}`);
  }

  return {
    ok: true,
    // 未启用 SMTP 时，开发环境返回验证码便于调试
    ...(process.env.NODE_ENV === "development" && !cfg.enabled ? { debugCode: code } : {}),
  };
}

/**
 * 校验验证码并把当前账号邮箱更新为新邮箱（需登录）。
 */
export async function bindEmail(
  newEmail: string,
  code: string,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };

  const email = (newEmail || "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return { error: "请输入正确的邮箱" };
  if (!code) return { error: "请输入验证码" };

  const result = verifyCode(email, code);
  if (!result.success) return { error: result.error };

  // 并发唯一性复查
  const duplicate = await prisma.user.findFirst({
    where: { email, NOT: { id: session.user.id } },
  });
  if (duplicate) return { error: "该邮箱已被其他账号使用" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { email },
  });

  return { ok: true };
}
