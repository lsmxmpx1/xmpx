"use server";

import { signIn, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

type AdminState = { error?: string } | undefined;

/**
 * 管理员登录：使用 credentials 登录。
 *
 * 性能优化：
 * - 原逻辑：signIn() → 远程函数调用(含1次Turso查询) → 再 prisma.findUnique(第2次查询) → redirect
 *   在 Vercel 免费版上，两次远程 Turso 查询 + 冷启动很容易超 10s 函数限制
 * - 现逻辑：只依赖 signIn 的结果，authorize 回调内部已验证密码+返回角色信息，
 *   不再额外查库。如果 signIn 成功但角色不对，由前端 session 守卫拦截。
 */
export async function adminLogin(formData: FormData): Promise<AdminState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "请输入管理员账号和密码" };
  }

  // signIn 内部调用 /api/auth/.../[action]（Serverless Function），
  // authorize 回调会连 Turso 做一次 findFirst+bcrypt.compare 验证。
  // redirect=false 让它返回结果而非自动跳转，避免额外请求。
  const res = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  if (res?.error) {
    return { error: "账号或密码错误" };
  }

  // signIn 成功即说明密码正确且用户存在，直接放行到后台。
  // 角色校验交给 /admin 路由的 middleware 或页面内 session 检查（已有守卫）。
  redirect("/admin");
}

/** 管理员退出登录 */
export async function adminLogout() {
  await signOut({ redirectTo: "/admin/login" });
}
