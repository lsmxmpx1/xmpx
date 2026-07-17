"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { submitFeedback, submitFeedbackReply } from "./actions";
import EmojiPicker from "./EmojiPicker";

export default function FeedbackForm() {
  const { data: session, status } = useSession();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  /** 在光标处插入表情 */
  function insertEmoji(emoji: string) {
    const ta = contentRef.current;
    if (!ta) {
      setContent((c) => c + emoji);
      return;
    }
    const start = ta.selectionStart ?? content.length;
    const end = ta.selectionEnd ?? content.length;
    const next = content.slice(0, start) + emoji + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + emoji.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    fd.set("content", content);
    const res = await submitFeedback(fd);
    setSubmitting(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setDone(true);
    setContent("");
    e.currentTarget.reset();
    router.refresh();
  }

  // 加载中
  if (status === "loading") {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center text-sm text-gray-400">
        加载中…
      </div>
    );
  }

  // 未登录 → 显示提示
  if (!session) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
        <p className="text-sm text-gray-500 mb-3">仅注册用户可提交反馈</p>
        <Link
          href="/auth/login"
          className="inline-block px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          去登录
        </Link>
      </div>
    );
  }

  // 提交成功
  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm">
        提交成功！我们会尽快核实处理，处理结果将公开显示在下方列表中。
        <button
          className="ml-3 text-green-800 underline"
          onClick={() => setDone(false)}
        >
          再提交一条
        </button>
      </div>
    );
  }

  // 已登录 → 直接显示表单
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">反馈类型</label>
          <select
            name="type"
            defaultValue="INSTITUTION"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="INSTITUTION">机构问题</option>
            <option value="COURSE">课程问题</option>
            <option value="OTHER">其他问题</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            关联机构 / 课程名称（选填）
          </label>
          <input
            name="targetName"
            type="text"
            placeholder="如：某某培训机构"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm text-gray-600">反馈内容</label>
          <EmojiPicker onSelect={insertEmoji} />
        </div>
        <textarea
          ref={contentRef}
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
          maxLength={2000}
          placeholder="请描述您遇到的问题，如虚假宣传、违规内容、课程纠纷等"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-60"
      >
        {submitting ? "提交中…" : "提交反馈"}
      </button>
    </form>
  );
}

/* ----------------------- 回复组件（嵌入留言列表） ----------------------- */

export function ReplyForm({ feedbackId }: { feedbackId: string }) {
  const { data: session, status } = useSession();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  /** 在光标处插入表情 */
  function insertEmoji(emoji: string) {
    const ta = contentRef.current;
    const start = ta?.selectionStart ?? content.length;
    const end = ta?.selectionEnd ?? content.length;
    const next = content.slice(0, start) + emoji + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      if (!ta) return;
      ta.focus();
      const pos = start + emoji.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setErr("");
    const fd = new FormData();
    fd.set("feedbackId", feedbackId);
    fd.set("content", content.trim());
    const res = await submitFeedbackReply(fd);
    setSubmitting(false);
    if (res?.error) {
      setErr(res.error);
      return;
    }
    setContent("");
    setDone(true);
    router.refresh();
    setTimeout(() => setDone(false), 3000);
  }

  if (status === "loading") return null;

  // 未登录 → 不显示回复框
  if (!session) return null;

  if (done) {
    return (
      <div className="mt-2 text-sm text-green-600">回复成功！</div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">回复</span>
        <EmojiPicker onSelect={insertEmoji} />
      </div>
      <textarea
        ref={contentRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        rows={2}
        maxLength={1000}
        placeholder="写下你的回复…"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      {err && <p className="text-xs text-red-500">{err}</p>}
      <button
        type="submit"
        disabled={submitting || !content.trim()}
        className="px-4 py-1.5 bg-blue-50 text-blue-600 text-xs rounded-lg hover:bg-blue-100 disabled:opacity-50"
      >
        {submitting ? "发送中…" : "回复"}
      </button>
    </form>
  );
}
