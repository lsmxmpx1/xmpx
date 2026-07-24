"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";

// 通知类型 → 图标 + 颜色 + 跳转路径生成
const TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  MESSAGE: { icon: "💬", color: "bg-blue-50 border-blue-200", label: "私信" },
  CONTACT: { icon: "📋", color: "bg-amber-50 border-amber-200", label: "咨询" },
  FEEDBACK_REPLY: { icon: "💭", color: "bg-green-50 border-green-200", label: "留言回复" },
  REVIEW: { icon: "⭐", color: "bg-yellow-50 border-yellow-200", label: "评价" },
  QUESTION_APPROVED: { icon: "✅", color: "bg-emerald-50 border-emerald-200", label: "提问通过" },
  ANSWER_APPROVED: { icon: "💡", color: "bg-purple-50 border-purple-200", label: "新回复" },
  ADMIN_REPLY_QUESTION: { icon: "📌", color: "bg-indigo-50 border-indigo-200", label: "管理员回复" },
};

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  relatedType?: string | null;
  relatedId?: string | null;
  readAt?: Date | string | null;
  createdAt: Date | string;
}

interface Props {
  initialData: {
    items: NotificationItem[];
    total: number;
    unread: number;
  };
}

/** 根据通知类型和关联实体生成跳转链接 */
function getLink(n: NotificationItem): string | null {
  switch (n.type) {
    case "MESSAGE":
      return n.relatedType === "Conversation" && n.relatedId ? `/dashboard/messages?c=${n.relatedId}` : "/dashboard/messages";
    case "CONTACT":
      return "/dashboard/institution";
    case "FEEDBACK_REPLY":
      return "/feedback";
    case "REVIEW":
      // 评价关联课程或机构，跳到对应详情
      if (n.relatedType === "Course" && n.relatedId) return `/courses/${n.relatedId}`;
      if (n.relatedType === "Institution" && n.relatedId) return `/institutions/${n.relatedId}`;
      return null;
    case "QUESTION_APPROVED":
    case "ANSWER_APPROVED":
    case "ADMIN_REPLY_QUESTION":
      if (n.relatedType === "Question" && n.relatedId) return `/questions/${n.relatedId}`;
      return "/questions";
    default:
      return null;
  }
}

export default function NotificationsClient({ initialData }: Props) {
  const [items, setItems] = useState<NotificationItem[]>(initialData.items);
  const [unread, setUnread] = useState(initialData.unread);
  const [loading, setLoading] = useState(false);

  /** 点击通知：标记已读并跳转 */
  const handleClick = useCallback(
    async (n: NotificationItem) => {
      if (!n.readAt) {
        try {
          await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: n.id }),
          });
          setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, readAt: new Date().toISOString() } : i)));
          setUnread((u) => Math.max(0, u - 1));
        } catch {}
      }
      const link = getLink(n);
      if (link) window.location.href = link;
    },
    []
  );

  /** 全部标记已读 */
  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
      if (res.ok) {
        setItems((prev) => prev.map((i) => ({ ...i, readAt: new Date().toISOString() })));
        setUnread(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const cfg = TYPE_CONFIG;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">消息中心</h1>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={loading}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
            >
              {loading ? "处理中..." : "全部已读"}
            </button>
          )}
          <span className="text-sm text-gray-500">
            {unread > 0 ? `${unread} 条未读` : "已全部阅读"}
          </span>
        </div>
      </div>

      {/* 列表 */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>暂无消息</p>
          <p className="text-sm mt-1">有人联系你或回复你时，消息会显示在这里</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const c = cfg[n.type] || { icon: "🔔", color: "bg-gray-50 border-gray-200", label: "通知" };
            const link = getLink(n);
            const unreadItem = !n.readAt;

            return (
              <li key={n.id}>
                {link ? (
                  <button
                    onClick={() => handleClick(n)}
                    className={`w-full text-left rounded-lg border p-4 transition-colors hover:shadow-sm ${
                      unreadItem ? "border-primary-300 bg-primary-50/30" : `${c.color} border-transparent`
                    }`}
                  >
                    <NotificationRow n={n} c={c} unread={unreadItem} />
                  </button>
                ) : (
                  <div
                    className={`w-full rounded-lg border p-4 ${unreadItem ? "border-primary-300 bg-primary-50/30" : `${c.color} border-transparent`}`}
                  >
                    <NotificationRow n={n} c={c} unread={unreadItem} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* 返回 */}
      <div className="mt-8 text-center">
        <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
          ← 返回用户中心
        </Link>
      </div>
    </div>
  );
}

/** 单条通知行 */
function NotificationRow({
  n,
  c,
  unread,
}: {
  n: NotificationItem;
  c: { icon: string; color: string; label: string };
  unread: boolean;
}) {
  const timeAgo = formatTimeAgo(new Date(n.createdAt));

  return (
    <div className="flex items-start gap-3">
      <span className="text-xl flex-shrink-0 mt-0.5">{c.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${unread ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"}`}>
            {c.label}
          </span>
          {unread && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
        </div>
        <p className={`text-sm mt-1 ${unread ? "font-medium text-gray-900" : "text-gray-700"}`}>{n.title}</p>
        {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
        <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
      </div>
    </div>
  );
}

/** 简易相对时间 */
function formatTimeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "刚刚";
  if (sec < 3600) return `${Math.floor(sec / 60)} 分钟前`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} 小时前`;
  if (sec < 604800) return `${Math.floor(sec / 86400)} 天前`;
  return date.toLocaleDateString("zh-CN");
}
