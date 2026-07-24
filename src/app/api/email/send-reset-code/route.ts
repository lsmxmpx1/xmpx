import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEmailConfig, sendEmail, buildResetMailHtml } from "@/lib/email";
import { generateCode, saveCode, canSend } from "@/lib/email-store";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "请输入正确的邮箱" }, { status: 400 });
    }

    // 检查该邮箱是否已注册（避免向未注册邮箱发信，同时防止邮箱枚举——未注册也返回成功提示）
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: true, message: "若该邮箱已注册，验证码将发送至该邮箱" });
    }

    // 检查发送频率
    const cooldown = await canSend(email);
    if (!cooldown.ok) {
      return NextResponse.json(
        { error: `发送过于频繁，请 ${cooldown.waitSeconds} 秒后再试` },
        { status: 429 },
      );
    }

    const code = generateCode();
    await saveCode(email, code);

    const cfg = await getEmailConfig();
    const result = await sendEmail({
      to: email,
      subject: "厦门培训网 · 找回密码验证码",
      html: buildResetMailHtml(code),
      text: `您的找回密码验证码是：${code}（5 分钟内有效）。如非本人操作请忽略。`,
    });

    if (!result.success) {
      console.error(`[EMAIL] 发送失败: ${result.error}`);
    }

    return NextResponse.json({
      success: true,
      message: "验证码已发送，请查收邮箱",
      // 未启用 SMTP 时，开发环境返回验证码便于调试
      ...(process.env.NODE_ENV === "development" && !cfg.enabled ? { debugCode: code } : {}),
    });
  } catch {
    return NextResponse.json({ error: "发送失败，请稍后重试" }, { status: 500 });
  }
}
