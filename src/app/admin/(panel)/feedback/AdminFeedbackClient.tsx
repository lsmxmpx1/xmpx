"use client";

import { useState, useTransition } from "react";
import { fmtDateTime } from "@/lib/format";

// 后台留言板：每条留言支持"查看模式（只读）↔ 编辑模式"切换
// 默认：新留言（PENDING）自动进入编辑模式；已处理的进入查看模式

const TYPE_LABEL: Record<string, string> = {
  INSTITUTION: "机构问题",
  COURSE: "课程问题",
  OTHER: "其他问题",
};

const STATUS_OPTIONS = [
  { value: "PENDING", label: "待处理" },
  { value: "RESOLVED", label: "已处理" },
  { value: "TAKEDOWN", label: "已下架" },
  { value: "REJECTED", label: "已驳回" },
];

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "待处理", cls: "bg-gray-100 text-gray-600" },
  RESOLVED: { label: "已处理", cls: "bg-green-100 text-green-700" },
  TAKEDOWN: { label: "已下架", cls: "bg-red-100 text-red-700" },
  REJECTED: { label: "已驳回", cls: "bg-orange-100 text-orange-700" },
};

/** 默认头像 */
function Avatar({ src, name, size = 32 }: { src?: string | null; name?: string | null; size?: number }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  if (src) {
    return (
      <img src={src} alt={name || ""} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium flex-shrink-0"
      style={{ width: size, height: size, fontSize: Math.max(size * 0.4, 11) }}>
      {initial}
    </div>
  );
}

type FeedbackItem = {
  id: string;
  authorName: string | null;
  type: string;
  targetName: string | null;
  content: string;
  status: string;
  adminReply: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string | null; image: string | null } | null;
  replies: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string | null; image: string | null } | null;
  }>;
};

function FeedbackCard({ item }: { item: FeedbackItem }) {
  const [editing, setEditing] = useState(item.status === "PENDING");
  const [status, setStatus] = useState(item.status);
  const [adminReply, setAdminReply] = useState(item.adminReply || "");
  const [isPublic, setIsPublic] = useState(item.isPublic);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const fd = new FormData();
      fd.set("status", status);
      fd.set("adminReply", adminReply);
      fd.set("isPublic", isPublic ? "on" : "");
      const res = await fetch("/api/admin-feedback", {
        method: "POST",
        body: JSON.stringify({ id: item.id, status, adminReply, isPublic }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  async function handleDelete() {
    if (!confirm("确定删除这条留言吗？此操作不可恢复。")) return;
    const res = await fetch(`/api/admin-feedback?id=${item.id}`, { method: "DELETE" });
    if (res.ok) window.location.reload();
  }

  async function handleDeleteReply(replyId: string) {
    if (!confirm("确定删除这条回复吗？")) return;
    const res = await fetch(`/api/admin-feedback?replyId=${replyId}`, { method: "DELETE" });
    if (res.ok) window.location.reload();
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-4 ${item.isPublic ? "border-gray-100" : "border-amber-200 bg-amber-50/30"}`}>
      {/* 头部信息 */}
      <div className="flex items-start gap-3 mb-2">
        <Avatar src={item.user?.image} name={item.authorName || item.user?.name} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-800">{item.authorName || item.user?.name || "匿名用户"}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{TYPE_LABEL[item.type] ?? "其他"}</span>
            {item.targetName && <span className="text-xs text-gray-500">关联：{item.targetName}</span>}
            {!item.isPublic && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">前台隐藏</span>}
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_META[item.status]?.cls}`}>{STATUS_META[item.status]?.label}</span>
            <span className="text-xs text-gray-400 ml-auto">创建：{fmtDateTime(item.createdAt)} · 修改：{fmtDateTime(item.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* 内容 */}
      <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3 ml-11">{item.content}</p>

      {/* 用户回复列表 */}
      {item.replies.length > 0 && (
        <div className="ml-11 mb-3 space-y-2">
          <p className="text-xs font-medium text-gray-500 mb-1">用户回复（{item.replies.length}）</p>
          {item.replies.map((r) => (
            <div key={r.id} className="flex items-start gap-2 bg-gray-50 rounded-lg px-3 py-2 group">
              <Avatar src={r.user?.image} name={r.user?.name} size={24} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{r.user?.name || "用户"}</span>
                  <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString("zh-CN")}</span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{r.content}</p>
              </div>
              <button onClick={() => handleDeleteReply(r.id)} className="opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-red-700 transition-opacity">
                删除
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 管理员处理区域 */}
      <div className="ml-11 border-t border-gray-100 pt-3">
        {saved && (
          <div className="mb-2 text-sm text-green-600 font-medium">✓ 已保存</div>
        )}

        {editing ? (
          /* 编辑模式 */
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">处理状态</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                  在前台公开展示
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">处理结果 / 回复（将公开显示）</label>
              <textarea value={adminReply} onChange={(e) => setAdminReply(e.target.value)}
                rows={2} maxLength={2000}
                placeholder="如：经查实该机构存在违规宣传，已做下架处理。"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={pending}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {pending ? "保存中…" : "保存处理"}
              </button>
              <button type="button" onClick={() => { setEditing(false); setStatus(item.status); setAdminReply(item.adminReply || ""); setIsPublic(item.isPublic); }}
                className="px-4 py-1.5 border border-gray-200 text-gray-500 text-sm rounded-lg hover:bg-gray-50">
                取消
              </button>
              <button type="button" onClick={handleDelete}
                className="px-4 py-1.5 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 ml-auto">
                删除
              </button>
            </div>
          </form>
        ) : (
          /* 只读模式 */
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">状态：</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_META[status]?.cls}`}>{STATUS_META[status]?.label}</span>
              <span className="text-xs text-gray-500">展示：</span>
              <span className={`text-xs ${isPublic ? "text-green-600" : "text-amber-600"}`}>{isPublic ? "公开" : "隐藏"}</span>
              <button onClick={() => setEditing(true)} className="ml-auto text-xs text-blue-600 hover:text-blue-800 underline">
                ✏️ 编辑
              </button>
            </div>
            {adminReply && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                <span className="font-medium text-gray-700">回复：</span>{adminReply}
              </div>
            )}
            {!adminReply && <p className="text-xs text-gray-400 italic">暂无处理结果</p>}
            <button onClick={() => setEditing(true)}
              className="mt-1 px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg hover:bg-blue-100">
              编辑处理
            </button>
            <button onClick={handleDelete}
              className="ml-2 px-3 py-1 border border-red-200 text-red-600 text-xs rounded-lg hover:bg-red-50">
              删除
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==================== 主页面 ==================== */

export default function AdminFeedbackPage({ list }: { list: FeedbackItem[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">网站留言板</h2>
        <span className="text-sm text-gray-500">共 {list.length} 条</span>
      </div>

      <div className="space-y-4">
        {list.map((item) => (
          <FeedbackCard key={item.id} item={item} />
        ))}

        {list.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
            暂无留言
          </div>
        )}
      </div>
    </div>
  );
}
