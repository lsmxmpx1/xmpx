"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaSrc, setCaptchaSrc] = useState("/api/captcha?t=" + Date.now());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 重新获取验证码（换 cookie）
  const refreshCaptcha = useCallback(() => {
    setCaptcha("");
    setCaptchaSrc("/api/captcha?t=" + Date.now());
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email: email || undefined,
        phone: phone || undefined,
        password,
        captcha,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "注册失败");
      refreshCaptcha(); // 失败后刷新验证码
      setLoading(false);
    } else {
      router.push("/auth/login?registered=true");
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-2">创建账号</h1>
        <p className="text-gray-500 text-center mb-8">注册厦门培训网，开启学习之旅</p>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="请输入昵称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
          />
          <input
            type="email"
            placeholder="请输入邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
          <input
            type="text"
            placeholder="请输入手机号（选填）"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
            className="input-field"
            maxLength={11}
          />
          <input
            type="password"
            placeholder="请输入密码（至少6位）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            required
            minLength={6}
          />

          {/* 图形验证码 */}
          <div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="请输入右侧验证码"
                value={captcha}
                onChange={(e) => setCaptcha(e.target.value.toUpperCase())}
                className="input-field flex-1"
                maxLength={5}
                autoComplete="off"
                required
              />
              <img
                src={captchaSrc}
                alt="验证码"
                onClick={refreshCaptcha}
                className="h-11 rounded border border-gray-200 cursor-pointer select-none"
                title="点击图片刷新验证码"
              />
            </div>
            <button
              type="button"
              onClick={refreshCaptcha}
              className="text-xs text-primary-600 hover:underline mt-1"
            >
              看不清？换一张
            </button>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? "注册中..." : "注册"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          已有账号？
          <Link href="/auth/login" className="text-primary-600 font-medium ml-1 hover:underline">
            立即登录
          </Link>
        </div>
      </div>
    </div>
  );
}
