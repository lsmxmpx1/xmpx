"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AnswerForm({ questionId }: { questionId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);
    const res = await fetch(`/api/questions/${questionId}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "提交失败");
      setLoading(false);
    } else {
      setContent("");
      setMsg("回复已提交，管理员审核通过后将公开展示");
      setLoading(false);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-5">
      {msg && <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm mb-3">{msg}</div>}
      {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm mb-3">{error}</div>}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="写下你的解答或经验..."
        className="input-field min-h-[100px] resize-y"
        maxLength={2000}
        required
      />
      <div className="flex justify-end mt-3">
        <button type="submit" disabled={loading} className="btn-primary px-6 py-2.5 text-sm">
          {loading ? "提交中..." : "提交回复"}
        </button>
      </div>
    </form>
  );
}
