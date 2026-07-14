"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

type AdminState = { error?: string } | undefined;

/** 管理员登录：使用 credentials 登录并校验 ADMIN 角色 */
export async function adminLogin(formData: FormData): Promise<AdminState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "请输入管理员账号和密码" };
  }

  const res = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  if (res?.error) {
    return { error: "账号或密码错误" };
  }

  // 同一请求内 session cookie 尚未可读，直接从数据库校验角色
  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    // 非管理员账号：清除刚写入的会话并拒绝
    await signOut({ redirect: false });
    return { error: "该账号无后台管理权限" };
  }

  redirect("/admin");
}

/** 管理员退出登录 */
export async function adminLogout() {
  await signOut({ redirectTo: "/admin/login" });
}
