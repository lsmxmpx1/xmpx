"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function BindPhonePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") || "";

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  async function sendSmsCode() {
    if (!phone || !/^1\d{10}$/.test(phone)) {
      setError("请输入正确的手机号");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || "发送失败");
    }
    setSending(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!phone || !/^1\d{10}$/.test(phone)) {
      setError("请输入正确的手机号");
      setLoading(false);
      return;
    }
    if (!code || code.length < 6) {
      setError("请输入验证码");
      setLoading(false);
      return;
    }

    try {
      // 调用绑定 API
      const bindRes = await fetch("/api/auth/bind-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      const bindData = await bindRes.json();
      if (!bindRes.ok) throw new Error(bindData.error);

      // 绑定成功后用验证码登录
      const loginRes = await signIn("phonecode", {
        phone,
        code,
        redirect: false,
      });

      if (loginRes?.error) {
        throw new Error("登录失败，请重试");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "绑定失败");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-4">
              <svg className="w-9 h-9 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">绑定手机号</h1>
            <p className="text-gray-500 text-sm">
              微信扫码成功，请绑定手机号完成注册
            </p>
            {uid && (
              <p className="text-xs text-gray-400 mt-1">
                用户ID: {uid.slice(0, 8)}...
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 手机号 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                手机号
              </label>
              <input
                type="tel"
                maxLength={11}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="请输入手机号"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-lg"
                autoComplete="tel"
              />
              <p className="text-xs text-gray-400 mt-1">
                绑定后可用于短信验证码快捷登录
              </p>
            </div>

            {/* 验证码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                短信验证码
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="6位验证码"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-lg tracking-widest"
                  autoComplete="one-time-code"
                />
                <button
                  type="button"
                  onClick={sendSmsCode}
                  disabled={sending || countdown > 0}
                  className="px-5 py-3 bg-green-50 text-green-600 font-medium rounded-xl hover:bg-green-100 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
                >
                  {countdown > 0 ? `${countdown}s后重发` : sending ? "发送中..." : "获取验证码"}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-semibold py-3.5 rounded-xl hover:bg-green-700 transition disabled:opacity-50 text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  绑定中...
                </span>
              ) : (
                "完成绑定并登录"
              )}
            </button>
          </form>

          {/* 底部 */}
          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-sm text-gray-500">
              已有账号？
              <Link href="/auth/login" className="text-green-600 hover:underline ml-1">
                直接登录
              </Link>
            </p>
            <Link href="/" className="inline-block mt-3 text-sm text-gray-400 hover:text-gray-600">
              ← 返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
