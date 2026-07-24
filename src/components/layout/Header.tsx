"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { SITE_NAME } from "@/lib/constants";
import Logo from "@/components/Logo";

const NAV_LINKS = [
  { href: "/", label: "首页" },
  { href: "/courses", label: "找课程" },
  { href: "/institutions", label: "找机构" },
  { href: "/teachers", label: "找老师" },
  { href: "/recommend", label: "精选推荐" },
  { href: "/articles", label: "资讯" },
  { href: "/questions", label: "问答社区" },
];

export default function Header() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 轮询未读消息数（登录时每 30 秒一次）
  useEffect(() => {
    if (!session?.user?.id) return;
    let mounted = true;
    async function fetchUnread() {
      try {
        const res = await fetch("/api/notifications?unread=1");
        if (res.ok) {
          const data = await res.json();
          if (mounted) setUnreadCount(data.unread ?? 0);
        }
      } catch {}
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => { mounted = false; clearInterval(interval); };
  }, [session?.user?.id]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-primary-600 text-white text-sm">
        <div className="container-main flex justify-between items-center py-1.5">
          <span>厦门本地2000+优质培训机构入驻中，找培训就上{SITE_NAME}</span>
          <div className="hidden sm:flex gap-4 items-center">
            {session?.user ? (
              <>
                {/* 消息中心铃铛 */}
                <Link
                  href="/dashboard/notifications"
                  className="relative flex items-center hover:opacity-80 transition-opacity"
                  title="消息中心"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>

                <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 hover:underline cursor-pointer px-2 py-1 rounded-md hover:bg-white/10 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                    {(session.user.name || "用户")[0]}
                  </span>
                  <span>{session.user.name || "用户"}</span>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className={`absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 w-44 z-50 overflow-hidden transition-all duration-200 origin-top-right ${
                    userMenuOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
                  }`}
                >
                  <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50/50">
                    <p className="text-xs text-gray-500">已登录</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{session.user.name || "用户"}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    用户中心
                  </Link>
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    消息中心
                    {unreadCount > 0 && (
                      <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 leading-none">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/dashboard/security"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    账号安全
                  </Link>
                  <button
                    onClick={() => { setUserMenuOpen(false); signOut(); }}
                    className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    退出登录
                  </button>
                </div>
              </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="hover:underline">登录</Link>
                <Link href="/auth/register" className="hover:underline">注册</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container-main">
        <div className="flex items-center justify-between py-3">
          {/* Logo */}
          <Logo />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  link.href === "/recommend"
                    ? "text-primary-600 bg-primary-50 hover:bg-primary-100"
                    : "text-gray-600 hover:text-primary-600 hover:bg-primary-50"
                }`}
              >
                {link.label}
                {link.href === "/recommend" && (
                  <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white leading-none">
                    HOT
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="container-main py-3 space-y-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-3 rounded-lg transition-colors ${
                  link.href === "/recommend"
                    ? "text-primary-600 bg-primary-50 font-semibold"
                    : "text-gray-600 hover:bg-primary-50 hover:text-primary-600"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
                {link.href === "/recommend" && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white leading-none">
                    HOT
                  </span>
                )}
              </Link>
            ))}
            <div className="flex gap-2 pt-3 border-t">
              {session?.user ? (
                <>
                  <Link href="/dashboard" className="btn-primary flex-1 text-center text-sm" onClick={() => setMobileOpen(false)}>用户中心</Link>
                  <button onClick={() => signOut()} className="btn-secondary flex-1 text-center text-sm">退出</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="btn-primary flex-1 text-center text-sm" onClick={() => setMobileOpen(false)}>登录</Link>
                  <Link href="/auth/register" className="btn-secondary flex-1 text-center text-sm" onClick={() => setMobileOpen(false)}>注册</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
