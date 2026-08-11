"use client";

import Link from "next/link";
import FeedbackForm, { ReplyForm } from "./FeedbackForm";

type FeedbackItem = {
  id: string;
  authorName: string | null;
  type: string;
  targetName: string | null;
  content: string;
  status: string;
  adminReply: string | null;
  isPublic: boolean;
  isGuest?: boolean;
  ipAddress?: string | null;
  ipCountry?: string | null;
  ipCity?: string | null;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null } | null;
  replies: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string | null; image: string | null } | null;
  }>;
};

/** 默认头像 SVG（内联，避免外部请求） */
function Avatar({ src, name, size = 36 }: { src?: string | null; name?: string | null; size?: number }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt={name || "用户"}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium flex-shrink-0"
      style={{ width: size, height: size, fontSize: Math.max(size * 0.4, 12) }}
    >
      {initial}
    </div>
  );
}

export default function FeedbackPageClient({
  list,
  typeLabel,
  statusMeta,
}: {
  list: FeedbackItem[];
  typeLabel: Record<string, string>;
  statusMeta: Record<string, { label: string; cls: string }>;
}) {
  return (
    <div className="container-main py-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">网站留言板</h1>
      <p className="text-sm text-gray-500 mb-6">
        注册用户或游客均可留言反馈机构问题、课程问题或其他问题；游客留言将公开显示 IP
        地址及所在国家 / 城市。针对违规内容，管理员将进行下架处理，所有留言内容及处理结果公开透明。
      </p>

      {/* 提交区域 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">提交反馈</h2>
        <FeedbackForm />
      </div>

      {/* 留言列表 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          公开留言（{list.length}）
        </h2>

        <div className="space-y-4">
          {list.map((f) => {
            const status = statusMeta[f.status] ?? statusMeta.PENDING;
            return (
              <div
                key={f.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
              >
                {/* 头部：头像 + 信息行 */}
                <div className="flex items-start gap-3 mb-2">
                  <Avatar src={f.user?.image} name={f.authorName || f.user?.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">
                        {f.authorName || f.user?.name || "匿名用户"}
                      </span>
                      {f.isGuest && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          游客
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                        {typeLabel[f.type] ?? "其他问题"}
                      </span>
                      {f.targetName && (
                        <span className="text-xs text-gray-500">
                          关联：{f.targetName}
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${status.cls}`}
                      >
                        {status.label}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(f.createdAt).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 内容 */}
                <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3 ml-11">
                  {f.content}
                </p>

                {/* 游客匿名留言：展示 IP 及所在国家 / 城市 */}
                {f.isGuest && (
                  <div className="ml-11 mb-3 flex items-center gap-1.5 text-xs text-gray-400">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                    <span>
                      来自 {f.ipAddress || "本地"}
                      {f.ipCountry ? ` · ${f.ipCountry}` : ""}
                      {f.ipCity ? ` ${f.ipCity}` : ""}
                    </span>
                  </div>
                )}

                {/* 管理员回复 */}
                {f.adminReply && (
                  <div className="ml-11 mb-3 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                    <span className="font-medium text-gray-700">管理员回复：</span>
                    {f.adminReply}
                  </div>
                )}

                {/* 用户回复列表 */}
                {f.replies.length > 0 && (
                  <div className="ml-11 space-y-2 mb-2">
                    {f.replies.map((r) => (
                      <div key={r.id} className="flex items-start gap-2">
                        <Avatar
                          src={r.user?.image}
                          name={r.user?.name}
                          size={28}
                        />
                        <div className="flex-1 bg-blue-50/50 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-gray-700">
                              {r.user?.name || "用户"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(r.createdAt).toLocaleString("zh-CN")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{r.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 回复表单 */}
                <div className="ml-11">
                  <ReplyForm feedbackId={f.id} />
                </div>
              </div>
            );
          })}

          {list.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
              暂无公开留言，欢迎成为第一个反馈者。
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 text-center text-xs text-gray-400">
        返回 <Link href="/" className="text-blue-600 hover:underline">网站首页</Link>
      </div>
    </div>
  );
}
