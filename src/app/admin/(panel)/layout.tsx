import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { adminLogout } from "../actions";

const NAV = [
  { href: "/admin", label: "概览", icon: "📊" },
  { href: "/admin/courses", label: "课程管理", icon: "📚" },
  { href: "/admin/institutions", label: "机构管理", icon: "🏫" },
  { href: "/admin/categories", label: "分类管理", icon: "🗂️" },
  { href: "/admin/users", label: "用户管理", icon: "👤" },
  { href: "/admin/articles", label: "文章管理", icon: "📝" },
  { href: "/admin/ads", label: "广告管理", icon: "📣" },
  { href: "/admin/contacts", label: "联系留言", icon: "💬" },
  { href: "/admin/settings", label: "系统设置", icon: "⚙️" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 侧边栏 */}
      <aside className="w-60 bg-slate-900 text-slate-100 flex flex-col fixed inset-y-0 left-0">
        <div className="h-16 flex items-center px-5 text-lg font-bold border-b border-slate-800">
          厦门培训网 · 后台
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-slate-800 transition-colors"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <form action={adminLogout}>
            <button
              type="submit"
              className="w-full py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              退出登录
            </button>
          </form>
          <Link
            href="/"
            className="block text-center text-xs text-slate-400 mt-3 hover:text-slate-200"
          >
            返回网站前台 →
          </Link>
        </div>
      </aside>

      {/* 主内容 */}
      <div className="flex-1 ml-60 flex flex-col">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <h1 className="text-gray-800 font-semibold">管理后台</h1>
          <span className="text-sm text-gray-500">
            {session.user.email || session.user.name || "管理员"}
          </span>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
