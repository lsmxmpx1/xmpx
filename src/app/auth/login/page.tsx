"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setRegistered(true);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

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
        <input
          type="password"
          placeholder="请输入密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
          required
        />

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
