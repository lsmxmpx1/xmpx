"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Step = "email" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  async function handleSendCode() {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("请输入正确的邮箱");
      return;
    }
    setError("");
    setInfo("");
    setSendingCode(true);
    try {
      const res = await fetch("/api/email/send-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "发送失败");
      setStep("reset");
      setCountdown(60);
      setInfo("验证码已发送，请查收邮箱（5 分钟内有效）");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "发送失败");
    }
    setSendingCode(false);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("密码至少6位");
      return;
    }
    if (password !== confirm) {
      setError("两次输入的密码不一致");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "重置失败");
      router.push("/auth/login?reset=true");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "重置失败");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-2">找回密码</h1>
        <p className="text-gray-500 text-center mb-8">
          {step === "email" ? "输入注册邮箱，我们将发送验证码" : "输入验证码并设置新密码"}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
        )}
        {info && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">{info}</div>
        )}

        {step === "email" ? (
          <div className="space-y-4">
            <input
              type="email"
              placeholder="请输入注册邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={sendingCode}
              className="btn-primary w-full py-3 text-base"
            >
              {sendingCode ? "发送中..." : "发送验证码"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <input
              type="email"
              placeholder="注册邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
              readOnly
            />
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="请输入邮箱验证码"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="input-field flex-1"
                maxLength={6}
                required
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0}
                className="px-4 py-3 bg-primary-50 text-primary-600 font-medium rounded-xl hover:bg-primary-100 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
              >
                {countdown > 0 ? `${countdown}s` : sendingCode ? "发送中" : "重新发送"}
              </button>
            </div>
            <input
              type="password"
              placeholder="请输入新密码（至少6位）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
              minLength={6}
            />
            <input
              type="password"
              placeholder="请再次输入新密码"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input-field"
              required
              minLength={6}
            />
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? "重置中..." : "重置密码"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          想起密码了？
          <Link href="/auth/login" className="text-primary-600 font-medium ml-1 hover:underline">
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
}
