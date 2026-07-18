"use client";

import { useState } from "react";
import Link from "next/link";
import RoleSwitcher from "./RoleSwitcher";
import { ROLE_LABELS, normalizeRoles } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  content: string | null;
  createdAt: string;
  course: { id: string; title: string } | null;
  institution: { id: string; name: string } | null;
}

interface Favorite {
  id: string;
  courseId: string | null;
  institutionId: string | null;
  createdAt: string;
  course: { id: string; title: string; price: string | null; institution: { name: string } | null } | null;
  institution: { id: string; name: string; district: string | null } | null;
}

interface Contact {
  id: string;
  name: string | null;
  phone: string;
  message: string | null;
  createdAt: string;
  courseId: string | null;
  institutionId: string | null;
}

interface StudentDashboardProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    role: string;
    roles: string;
  };
  reviews: Review[];
  favorites: Favorite[];
  contacts: Contact[];
  hasInstitution: boolean;
}

type Tab = "overview" | "favorites" | "reviews" | "contacts";

export default function StudentDashboard({
  user,
  reviews,
  favorites,
  contacts,
  hasInstitution,
}: StudentDashboardProps) {
  const [tab, setTab] = useState<Tab>("overview");

  const tabs: { key: Tab; label: string; icon: string; badge?: number }[] = [
    { key: "overview", label: "概览", icon: "📊" },
    { key: "favorites", label: "我的收藏", icon: "❤️", badge: favorites.length },
    { key: "reviews", label: "我的评价", icon: "⭐", badge: reviews.length },
    { key: "contacts", label: "咨询记录", icon: "💬", badge: contacts.length },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 角色切换器 */}
      <RoleSwitcher current="USER" />

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">用户中心</h1>
          <p className="text-gray-500 mt-1">欢迎回来，{user.name || "用户"}</p>
        </div>
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 shadow-sm whitespace-nowrap shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          个人设置
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl shadow-sm p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key
                ? "bg-primary-600 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {t.badge !== undefined && t.badge > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-white/20" : "bg-gray-100"}`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-5 text-center">
              <div className="text-3xl font-bold text-red-500">{favorites.length}</div>
              <div className="text-sm text-gray-500 mt-1">收藏数量</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 text-center">
              <div className="text-3xl font-bold text-yellow-500">{reviews.length}</div>
              <div className="text-sm text-gray-500 mt-1">我的评价</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 text-center">
              <div className="text-3xl font-bold text-blue-500">{contacts.length}</div>
              <div className="text-sm text-gray-500 mt-1">咨询记录</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 text-center">
              <div className="text-3xl font-bold text-green-500">
                {reviews.length > 0
                  ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
                  : "—"}
              </div>
              <div className="text-sm text-gray-500 mt-1">平均评分</div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">账号信息</h3>
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                编辑资料 / 改密码
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-16 shrink-0">昵称：</span>
                <span className="text-gray-800">{user.name || "未设置"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-16 shrink-0">邮箱：</span>
                <span className="text-gray-800">{user.email || "未设置"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-16 shrink-0">手机：</span>
                <span className="text-gray-800">{user.phone || "未设置"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-16 shrink-0">身份：</span>
                <span className="text-gray-800 flex flex-wrap gap-1.5">
                  {normalizeRoles(user.roles).map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 text-xs font-medium"
                    >
                      {ROLE_LABELS[r] || r}
                    </span>
                  ))}
                </span>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t">
              {hasInstitution ? (
                <Link
                  href="/dashboard/institution"
                  className="flex items-center justify-between gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl px-5 py-4 hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                >
                  <div>
                    <div className="font-semibold text-base">管理我的机构</div>
                    <div className="text-sm text-white/80 mt-0.5">管理课程、查看咨询线索、购买推广</div>
                  </div>
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : (
                <Link
                  href="/dashboard/institution"
                  className="flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl px-5 py-4 hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
                >
                  <div>
                    <div className="font-semibold text-base">入驻培训机构</div>
                    <div className="text-sm text-white/80 mt-0.5">发布课程、获取生源、提升品牌曝光</div>
                  </div>
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Link>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setTab("favorites")}
              className="bg-white rounded-xl shadow-sm p-5 text-left hover:shadow-md transition-shadow group"
            >
              <div className="text-2xl mb-2">❤️</div>
              <div className="font-semibold text-gray-800 group-hover:text-primary-600">我的收藏</div>
              <div className="text-sm text-gray-400 mt-1">
                {favorites.length > 0 ? `${favorites.length} 个收藏的课程/机构` : "暂无收藏"}
              </div>
            </button>
            <button
              onClick={() => setTab("reviews")}
              className="bg-white rounded-xl shadow-sm p-5 text-left hover:shadow-md transition-shadow group"
            >
              <div className="text-2xl mb-2">⭐</div>
              <div className="font-semibold text-gray-800 group-hover:text-primary-600">我的评价</div>
              <div className="text-sm text-gray-400 mt-1">
                {reviews.length > 0 ? `${reviews.length} 条评价` : "暂无评价"}
              </div>
            </button>
            <button
              onClick={() => setTab("contacts")}
              className="bg-white rounded-xl shadow-sm p-5 text-left hover:shadow-md transition-shadow group"
            >
              <div className="text-2xl mb-2">💬</div>
              <div className="font-semibold text-gray-800 group-hover:text-primary-600">咨询记录</div>
              <div className="text-sm text-gray-400 mt-1">
                {contacts.length > 0 ? `${contacts.length} 条咨询` : "暂无咨询"}
              </div>
            </button>
            <Link
              href="/dashboard/messages"
              className="bg-white rounded-xl shadow-sm p-5 text-left hover:shadow-md transition-shadow group"
            >
              <div className="text-2xl mb-2">✉️</div>
              <div className="font-semibold text-gray-800 group-hover:text-primary-600">我的私信</div>
              <div className="text-sm text-gray-400 mt-1">查看老师与机构的回复</div>
            </Link>
          </div>
        </div>
      )}

      {/* Favorites Tab */}
      {tab === "favorites" && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-4">我的收藏</h3>
          {favorites.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">❤️</div>
              <p>暂无收藏</p>
              <Link href="/courses" className="text-primary-600 text-sm hover:underline mt-2 inline-block">
                去浏览课程 →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {favorites.map((fav) => (
                <div key={fav.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl shrink-0">
                    {fav.course ? "📖" : "🏫"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={fav.course ? `/courses/${fav.course.id}` : `/institutions/${fav.institution?.id}`}
                      className="font-medium text-gray-800 hover:text-primary-600 block truncate"
                    >
                      {fav.course?.title || fav.institution?.name}
                    </Link>
                    <div className="text-sm text-gray-400">
                      {fav.course
                        ? `${fav.course.institution?.name || ""} · ${fav.course.price || ""}`
                        : fav.institution?.district || ""}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 shrink-0">
                    {new Date(fav.createdAt).toLocaleDateString("zh-CN")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {tab === "reviews" && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-4">我的评价</h3>
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">⭐</div>
              <p>暂无评价</p>
              <Link href="/courses" className="text-primary-600 text-sm hover:underline mt-2 inline-block">
                去体验课程并评价 →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <Link
                      href={review.course ? `/courses/${review.course.id}` : `/institutions/${review.institution?.id}`}
                      className="font-medium text-gray-800 hover:text-primary-600"
                    >
                      {review.course?.title || review.institution?.name}
                    </Link>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400 text-sm mb-1">
                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                  </div>
                  {review.content && (
                    <p className="text-gray-600 text-sm">{review.content}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contacts Tab */}
      {tab === "contacts" && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-4">咨询记录</h3>
          {contacts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">💬</div>
              <p>暂无咨询记录</p>
              <Link href="/courses" className="text-primary-600 text-sm hover:underline mt-2 inline-block">
                去看看课程 →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div key={contact.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {contact.name || "匿名咨询"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(contact.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                  {contact.message && (
                    <p className="text-gray-600 text-sm mb-1">{contact.message}</p>
                  )}
                  <div className="text-xs text-gray-400">
                    联系电话：{contact.phone}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
