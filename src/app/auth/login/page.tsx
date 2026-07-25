"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setRegistered(true);
    }
    if (searchParams.get("reset") === "true") {
      setResetDone(true);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
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

      {resetDone && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-4 flex items-center justify-between">
          <span>✅ 密码已重置，请使用新密码登录</span>
          <button onClick={() => setResetDone(false)} className="text-green-400 hover:text-green-600">✕</button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="请输入邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          required
        />

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
        <span className="mx-2 text-gray-300">|</span>
        <Link href="/auth/forgot-password" className="text-primary-600 font-medium hover:underline">
          忘记密码？
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
