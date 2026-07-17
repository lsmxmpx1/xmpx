"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

/**
 * 更新用户基本信息（昵称、邮箱、手机号、头像）
 */
export async function updateProfile(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "请先登录" };
  }

  const name = String(formData.get("name") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;

  // 邮箱唯一性检查（排除自己）
  if (email) {
    const existing = await prisma.user.findFirst({
      where: { email, NOT: { id: session.user.id } },
    });
    if (existing) return { error: "该邮箱已被其他账号使用" };
  }

  // 手机唯一性检查
  if (phone) {
    const existing = await prisma.user.findFirst({
      where: { phone, NOT: { id: session.user.id } },
    });
    if (existing) return { error: "该手机号已被其他账号使用" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, email, phone },
  });

  revalidatePath("/dashboard/profile");
  return { ok: true };
}

/**
 * 更新头像 URL（由上传 API 返回的路径/URL）
 */
export async function updateAvatar(imageUrl: string): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: imageUrl },
  });

  revalidatePath("/dashboard/profile");
  revalidatePath("/feedback");
  return { ok: true };
}

/**
 * 修改密码（需验证旧密码）
 */
export async function changePassword(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };

  const oldPassword = String(formData.get("oldPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirm = String(formData.get("confirmPassword") || "");

  if (!oldPassword || !newPassword) return { error: "请填写完整" };
  if (newPassword.length < 6) return { error: "新密码至少 6 位" };
  if (newPassword !== confirm) return { error: "两次密码不一致" };

  // 获取当前用户（含密码哈希）
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (!user?.password) return { error: "当前账号未设密码（可能通过短信登录），无法修改" };

  const valid = await bcrypt.compare(oldPassword, user.password);
  if (!valid) return { error: "旧密码不正确" };

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  });

  return { ok: true };
}
