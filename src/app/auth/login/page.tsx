"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [phoneLoginMode, setPhoneLoginMode] = useState<"password" | "code">("password");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setRegistered(true);
    }
  }, [searchParams]);

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // 发送短信验证码
  async function handleSendCode() {
    if (!phone || !/^1\d{10}$/.test(phone)) {
      setError("请输入正确的手机号");
      return;
    }
    setError("");
    setSendingCode(true);
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "发送失败");
      setCountdown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "发送失败";
      setError(msg);
    }
    setSendingCode(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "phone" && phoneLoginMode === "code") {
      // 验证码登录
      const res = await signIn("phonecode", {
        phone,
        code: smsCode,
        redirect: false,
      });

      if (res?.error) {
        setError("验证码错误或已过期，请重试");
        setLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      // 密码登录（邮箱或手机）
      const res = await signIn("credentials", {
        email: mode === "email" ? email : undefined,
        phone: mode === "phone" ? phone : undefined,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("登录失败，请检查账号密码");
        setLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
      <h1 className="text-2xl font-bold text-center mb-2">欢迎回来</h1>
      <p className="text-gray-500 text-center mb-8">登录厦门培训网，发现更多好课程</p>

      {registered && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-4 flex items-center justify-between">
          <span>✅ 注册成功，请登录</span>
          <button onClick={() => setRegistered(false)} className="text-green-400 hover:text-green-600">✕</button>
        </div>
      )}

      {/* Mode switch */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setMode("email")}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === "email" ? "bg-white shadow-sm text-primary-600" : "text-gray-500"}`}
        >
          邮箱登录
        </button>
        <button
          onClick={() => setMode("phone")}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === "phone" ? "bg-white shadow-sm text-primary-600" : "text-gray-500"}`}
        >
          手机号登录
        </button>
      </div>

      {/* 手机模式下的子选项：密码/验证码 */}
      {mode === "phone" && (
        <div className="flex items-center gap-4 mb-4 text-sm">
          <button
            onClick={() => setPhoneLoginMode("password")}
            className={`font-medium transition-colors ${phoneLoginMode === "password" ? "text-primary-600" : "text-gray-400 hover:text-gray-600"}`}
          >
            密码登录
          </button>
          <span className="text-gray-200">|</span>
          <button
            onClick={() => setPhoneLoginMode("code")}
            className={`font-medium transition-colors ${phoneLoginMode === "code" ? "text-primary-600" : "text-gray-400 hover:text-gray-600"}`}
          >
            验证码登录
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "email" ? (
          <input
            type="email"
            placeholder="请输入邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            required
          />
        ) : (
          <input
            type="text"
            placeholder="请输入手机号"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
            className="input-field"
            maxLength={11}
            required
          />
        )}

        {mode === "phone" && phoneLoginMode === "code" ? (
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="请输入短信验证码"
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ""))}
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
              {countdown > 0 ? `${countdown}s` : sendingCode ? "发送中" : "获取验证码"}
            </button>
          </div>
        ) : (
          <input
            type="password"
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            required
          />
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
          {loading ? "登录中..." : "登录"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        还没有账号？
        <Link href="/auth/register" className="text-primary-600 font-medium ml-1 hover:underline">
          立即注册
        </Link>
      </div>

      {/* 分割线 */}
      <div className="flex items-center gap-4 mt-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">其他登录方式</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* 微信扫码登录 */}
      <Link
        href="/auth/wechat"
        className="mt-4 flex items-center justify-center gap-2 w-full py-3 border border-green-200 text-green-600 rounded-xl hover:bg-green-50 transition-colors font-medium"
      >
        <svg className="w-5 h-5" viewBox="0 0 48 48" fill="currentColor">
          <path d="M18.8 17.6c-.8-2.4-3-4-5.6-4-3.3 0-6 2.7-6 6s2.7 6 6 6c2.6 0 4.8-1.6 5.6-4h5.4l1.4 3 1.4-3h3.6v-4h-11.8zm-5.6 3.8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM33.6 24c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm0-3.2c1.5 0 2.8-1.3 2.8-2.8s-1.3-2.8-2.8-2.8-2.8 1.3-2.8 2.8 1.3 2.8 2.8 2.8zM20.8 26.4h-5.6l-1.4-3-1.4 3H7.2v4h13.6v-4z"/>
        </svg>
        微信扫码登录
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Suspense fallback={<div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 animate-pulse h-96" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
