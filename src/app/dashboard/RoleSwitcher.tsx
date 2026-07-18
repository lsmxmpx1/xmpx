"use client";

import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

type ViewKey = "USER" | "INSTITUTION" | "TEACHER";

const VIEWS: { key: ViewKey; label: string; icon: string; href: string }[] = [
  { key: "USER", label: "我是学员", icon: "🎓", href: "/dashboard" },
  { key: "INSTITUTION", label: "我是机构", icon: "🏫", href: "/dashboard/institution" },
  { key: "TEACHER", label: "我是老师", icon: "👨‍🏫", href: "/dashboard/teacher" },
];

/**
 * 角色切换器：单一账号在「学员 / 机构 / 老师」三种身份视图间自由切换。
 * - 始终显示三个入口（未拥有的身份点击后进入对应的「成为…」引导页）
 * - 切换时同步 session 的 activeRole，供 header/其他页读取当前视图
 */
export default function RoleSwitcher({ current }: { current: ViewKey }) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const roles: string[] = (session?.user?.roles as string[]) || ["USER"];

  async function switchTo(view: ViewKey, href: string) {
    // 已在该视图则不重复跳转
    const isActive =
      (view === "USER" && pathname === "/dashboard") ||
      (view === "INSTITUTION" && pathname.startsWith("/dashboard/institution")) ||
      (view === "TEACHER" && pathname.startsWith("/dashboard/teacher"));
    if (isActive) return;

    try {
      await update({ activeRole: view } as never);
    } catch {
      /* 切换视图仅为界面状态，失败不阻断跳转 */
    }
    router.push(href);
  }

  return (
    <div className="mb-6">
      <div className="inline-flex gap-1 bg-white rounded-xl shadow-sm p-1 border border-gray-100">
        {VIEWS.map((v) => {
          const active =
            (v.key === "USER" && current === "USER") ||
            (v.key === "INSTITUTION" && current === "INSTITUTION") ||
            (v.key === "TEACHER" && current === "TEACHER");
          const owned = roles.includes(v.key);
          return (
            <button
              key={v.key}
              onClick={() => switchTo(v.key, v.href)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                active
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{v.icon}</span>
              <span>{v.label}</span>
              {!owned && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    active ? "bg-white/20" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  未开通
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
