"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QA_CATEGORIES } from "@/lib/qa";

export default function AskQuestionForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(QA_CATEGORIES[0].key);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, category }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "提交失败");
      setLoading(false);
    } else {
      router.push("/questions?sent=1");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl shadow-sm border p-6">
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">选择板块</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {QA_CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                category === c.key
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-gray-200 text-gray-600 hover:border-primary-300"
              }`}
            >
              <span className="mr-1">{c.icon}</span>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">问题标题</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="一句话描述你的问题，例如：厦门哪里有靠谱的雅思培训班？"
          className="input-field"
          maxLength={80}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">问题详情</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="补充说明背景、具体需求，便于大家帮你解答"
          className="input-field min-h-[140px] resize-y"
          maxLength={2000}
          required
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
        {loading ? "提交中..." : "提交提问（进入人工审核）"}
      </button>
      <p className="text-xs text-gray-400 text-center">
        为防广告与垃圾信息，提问需经管理员审核通过后方可公开展示
      </p>
    </form>
  );
}
