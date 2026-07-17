"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { submitFeedback } from "./actions";

export default function FeedbackForm() {
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const res = await submitFeedback(fd);
    setSubmitting(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setDone(true);
    e.currentTarget.reset();
    router.refresh();
  }

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
        <label className="block text-sm text-gray-600 mb-1">反馈内容</label>
        <textarea
          name="content"
          required
          rows={4}
          maxLength={2000}
          placeholder="请描述您遇到的问题，如虚假宣传、违规内容、课程纠纷等"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "提交中…" : "提交反馈"}
        </button>
        <span className="text-xs text-gray-400">
          仅注册用户可提交；
          <Link href="/auth/login" className="text-blue-600 hover:underline ml-1">
            去登录
          </Link>
        </span>
      </div>
    </form>
  );
}
