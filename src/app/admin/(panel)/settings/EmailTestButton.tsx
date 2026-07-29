"use client";

import { useState } from "react";

interface Props {
  enabled: boolean;
}

export default function EmailTestButton({ enabled }: Props) {
  const [testTo, setTestTo] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok?: boolean; msg: string } | null>(null);

  async function handleTest() {
    if (!testTo.trim()) {
      setResult({ ok: false, msg: "请输入收件邮箱" });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testTo.trim() }),
      });
      const data = await res.json();
      setResult({ ok: data.success, msg: data.success ? data.message : data.error });
    } catch {
      setResult({ ok: false, msg: "请求失败，请检查网络" });
    }
    setSending(false);
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="email"
        value={testTo}
        onChange={(e) => setTestTo(e.target.value)}
        placeholder="输入收件邮箱测试发送"
        className="input-field w-56 text-sm"
      />
      <button
        type="button"
        onClick={handleTest}
        disabled={sending || !enabled}
        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          sending || !enabled
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {sending ? "发送中..." : "发送测试邮件"}
      </button>
      {!enabled && (
        <span className="text-xs text-amber-600">需先启用 SMTP 并保存</span>
      )}
      {result && (
        <span className={`text-xs font-medium ${result.ok ? "text-green-600" : "text-red-600"}`}>
          {result.msg}
        </span>
      )}
    </div>
  );
}
