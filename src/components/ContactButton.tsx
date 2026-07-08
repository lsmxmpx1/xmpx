"use client";

import { useState } from "react";

interface ContactButtonProps {
  courseId?: string;
  institutionId?: string;
  institutionName?: string;
  phone?: string;
  label?: string;
  variant?: "primary" | "secondary";
}

export default function ContactButton({
  courseId,
  institutionId,
  institutionName,
  phone,
  label = "立即咨询报名",
  variant = "primary",
}: ContactButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: contactPhone,
          message,
          courseId,
          institutionId,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setName("");
        setContactPhone("");
        setMessage("");
      } else {
        const data = await res.json();
        setError(data.error || "提交失败");
      }
    } catch {
      setError("网络错误，请稍后再试");
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={variant === "primary" ? "btn-primary w-full md:w-auto text-lg px-12 py-3" : "btn-secondary"}
      >
        {label}
      </button>
      {phone && (
        <div className="mt-3 text-sm text-gray-400">
          或致电 {phone} 了解更多
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {success ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold mb-2">提交成功！</h3>
                <p className="text-gray-500 text-sm mb-6">
                  {institutionName ? `${institutionName} ` : ""}会尽快与您联系，请保持手机畅通。
                </p>
                <button onClick={() => { setOpen(false); setSuccess(false); }} className="btn-primary w-full">
                  关闭
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-1">咨询报名</h3>
                <p className="text-gray-500 text-sm mb-6">
                  {institutionName ? `向 ${institutionName} 提交咨询` : "填写以下信息，机构会尽快联系您"}
                </p>

                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="text"
                    placeholder="您的称呼"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="手机号 *"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value.replace(/[^\d]/g, ""))}
                    className="input-field"
                    required
                    maxLength={11}
                  />
                  <textarea
                    placeholder="留言（选填）"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="input-field"
                    rows={3}
                  />
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">
                      取消
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary flex-1">
                      {loading ? "提交中..." : "提交咨询"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
