"use server";

import { signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

/** 管理员退出登录 */
export async function adminLogout() {
  await signOut({ redirectTo: "/admin/login" });
}
