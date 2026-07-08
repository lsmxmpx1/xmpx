"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function WechatLoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "scanning" | "confirming" | "success" | "need_bind" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [phoneSuffix, setPhoneSuffix] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expired, setExpired] = useState(false);

  const isDev = process.env.NODE_ENV === "development";

  // 开发环境：模拟扫码流程
  const simulateScan = useCallback(async () => {
    if (expired) return;
    setStatus("scanning");

    // 模拟扫码延迟
    await new Promise((r) => setTimeout(r, 1500));
    setStatus("confirming");

    // 模拟用户在手机上确认
    await new Promise((r) => setTimeout(r, 1200));

    // 调用模拟微信回调
    try {
      const mockOpenId = `wx_dev_${Date.now()}`;
      const mockNickname = `微信用户${Math.random().toString(36).slice(2, 6)}`;

      const res = await fetch("/api/auth/wechat-callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openid: mockOpenId,
          nickname: mockNickname,
          avatar: "",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "回调失败");
      }

      if (data.needBindPhone) {
        setStatus("need_bind");
      } else {
        setStatus("success");
        // 自动登录
        setPhoneSuffix(data.phone || "");
      }
    } catch {
      setStatus("error");
      setErrorMsg("微信授权失败，请重试");
    }
  }, [expired]);

  // 二维码过期计时（60秒）
  useEffect(() => {
    if (status !== "idle") return;
    const timer = setTimeout(() => {
      setExpired(true);
    }, 60000);
    return () => clearTimeout(timer);
  }, [status]);

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // 发送短信验证码
  async function sendSmsCode() {
    if (!phoneSuffix) {
      const phone = (document.getElementById("bindPhone") as HTMLInputElement)?.value;
      if (!phone || !/^1\d{10}$/.test(phone)) {
        setErrorMsg("请输入正确的手机号");
        return;
      }
    }
    setSending(true);
    try {
      const phone = phoneSuffix
        ? (document.getElementById("bindPhone") as HTMLInputElement)?.value
        : "";
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCountdown(60);
      setErrorMsg("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "发送失败";
      setErrorMsg(errorMessage);
    }
    setSending(false);
  }

  // 绑定手机号并登录
  async function handleBindPhone(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const phone = (document.getElementById("bindPhone") as HTMLInputElement).value;

      const res = await fetch("/api/auth/bind-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: smsCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // 绑定成功后，用验证码登录
      const loginRes = await signIn("phonecode", {
        phone,
        code: smsCode,
        redirect: false,
      });

      if (loginRes?.error) {
        throw new Error("登录失败，请重试");
      }

      setStatus("success");
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "绑定失败";
      setErrorMsg(errorMessage);
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
              <svg className="w-9 h-9 text-green-600" viewBox="0 0 48 48" fill="currentColor">
                <path d="M18.8 17.6c-.8-2.4-3-4-5.6-4-3.3 0-6 2.7-6 6s2.7 6 6 6c2.6 0 4.8-1.6 5.6-4h5.4l1.4 3 1.4-3h3.6v-4h-11.8zm-5.6 3.8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM33.6 24c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm0-3.2c1.5 0 2.8-1.3 2.8-2.8s-1.3-2.8-2.8-2.8-2.8 1.3-2.8 2.8 1.3 2.8 2.8 2.8zM20.8 26.4h-5.6l-1.4-3-1.4 3H7.2v4h13.6v-4z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">微信扫码注册/登录</h1>
            <p className="text-gray-500 text-sm">
              使用微信扫一扫快速登录，无需记住密码
            </p>
          </div>

          {/* 开发环境快捷入口 */}
          {isDev && status === "idle" && !expired && (
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <p className="text-amber-700 text-xs mb-2 font-medium">开发环境</p>
              <button
                onClick={simulateScan}
                className="bg-amber-500 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-amber-600 transition-colors"
              >
                模拟微信扫码
              </button>
            </div>
          )}

          {/* 二维码区域 */}
          {status === "idle" && !expired && (
            <div className="text-center">
              <div className="inline-block bg-white border-2 border-gray-200 rounded-xl p-4 mb-4">
                {/* 模拟二维码 SVG */}
                <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto">
                  {/* 定位图案 */}
                  <rect x="20" y="20" width="50" height="50" rx="6" fill="#07C160" />
                  <rect x="24" y="24" width="42" height="42" rx="4" fill="white" />
                  <rect x="30" y="30" width="26" height="26" rx="2" fill="#07C160" />

                  <rect x="130" y="20" width="50" height="50" rx="6" fill="#07C160" />
                  <rect x="134" y="24" width="42" height="42" rx="4" fill="white" />
                  <rect x="140" y="30" width="26" height="26" rx="2" fill="#07C160" />

                  <rect x="20" y="130" width="50" height="50" rx="6" fill="#07C160" />
                  <rect x="24" y="134" width="42" height="42" rx="4" fill="white" />
                  <rect x="30" y="140" width="26" height="26" rx="2" fill="#07C160" />

                  {/* 数据区域（模拟） */}
                  {Array.from({ length: 8 }).map((_, row) =>
                    Array.from({ length: 8 }).map((_, col) => (
                      <rect
                        key={`${row}-${col}`}
                        x={70 + col * 8}
                        y={20 + row * 8}
                        width="6"
                        height="6"
                        rx="1"
                        fill={(row * col + row) % 3 === 0 ? "#07C160" : "#e5e7eb"}
                      />
                    ))
                  )}
                  {Array.from({ length: 8 }).map((_, row) =>
                    Array.from({ length: 8 }).map((_, col) => (
                      <rect
                        key={`b${row}-${col}`}
                        x={70 + col * 8}
                        y={130 + row * 8}
                        width="6"
                        height="6"
                        rx="1"
                        fill={(row + col) % 2 === 0 ? "#07C160" : "#e5e7eb"}
                      />
                    ))
                  )}
                  {Array.from({ length: 13 }).map((_, row) =>
                    Array.from({ length: 13 }).map((_, col) => (
                      <rect
                        key={`c${row}-${col}`}
                        x={17 + col * 8}
                        y={75 + row * 8}
                        width="6"
                        height="6"
                        rx="1"
                        fill={(row * 3 + col * 2) % 5 === 0 ? "#07C160" : "#e5e7eb"}
                      />
                    ))
                  )}
                  {Array.from({ length: 4 }).map((_, row) =>
                    Array.from({ length: 4 }).map((_, col) => (
                      <rect
                        key={`d${row}-${col}`}
                        x={135 + col * 8}
                        y={75 + row * 8}
                        width="6"
                        height="6"
                        rx="1"
                        fill={(row + col * 2) % 3 === 0 ? "#07C160" : "#e5e7eb"}
                      />
                    ))
                  )}

                  {/* 微信 Logo */}
                  <circle cx="100" cy="100" r="16" fill="#07C160" opacity="0.9" />
                  <path d="M92 95h3v10h-3zM99 95v4h3v-4h3v10h-3v-4h-3v4h-3V95h3zM108 95c2 0 3.5 1.2 3.5 3.5s-1.5 3.5-3.5 3.5h-1v3h-3v-10h4z" fill="white" />
                </svg>
              </div>
              <div className="flex items-center justify-center gap-2 text-green-600">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm">等待微信扫码...</span>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                请使用微信&ldquo;扫一扫&rdquo;扫描二维码
              </p>
            </div>
          )}

          {/* 扫码中 */}
          {status === "scanning" && (
            <div className="text-center py-8">
              <div className="inline-block w-20 h-20 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mb-4" />
              <p className="text-gray-600">检测到扫码，请在手机微信中确认登录</p>
              <div className="mt-3 flex justify-center gap-1">
                <WaveDots />
              </div>
            </div>
          )}

          {/* 确认中 */}
          {status === "confirming" && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mb-4">
                <svg className="w-10 h-10 text-green-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600">微信已确认，正在登录...</p>
            </div>
          )}

          {/* 需要绑定手机号 */}
          {status === "need_bind" && (
            <div>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-3">
                  <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">绑定手机号</h2>
                <p className="text-sm text-gray-500 mt-1">
                  微信授权成功，请绑定手机号完成注册
                </p>
              </div>

              <form onSubmit={handleBindPhone} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    手机号
                  </label>
                  <input
                    id="bindPhone"
                    type="tel"
                    maxLength={11}
                    placeholder="请输入手机号"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    短信验证码
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="6位验证码"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ""))}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={sendSmsCode}
                      disabled={sending || countdown > 0}
                      className="px-4 py-3 bg-green-50 text-green-600 font-medium rounded-xl hover:bg-green-100 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
                    >
                      {countdown > 0 ? `${countdown}s` : sending ? "发送中" : "获取验证码"}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-red-500 text-sm">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white font-medium py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50"
                >
                  {loading ? "绑定中..." : "绑定并登录"}
                </button>
              </form>
            </div>
          )}

          {/* 二维码过期 */}
          {expired && status !== "need_bind" && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-1">二维码已过期</p>
              <p className="text-sm text-gray-400 mb-4">请刷新后重新扫码</p>
              <button
                onClick={() => {
                  setExpired(false);
                  setStatus("idle");
                }}
                className="bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 transition"
              >
                刷新二维码
              </button>
            </div>
          )}

          {/* 错误 */}
          {status === "error" && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-600 mb-1">{errorMsg || "授权失败"}</p>
              <button
                onClick={() => {
                  setStatus("idle");
                  setExpired(false);
                  setErrorMsg("");
                }}
                className="mt-4 text-green-600 hover:underline text-sm"
              >
                重新扫码
              </button>
            </div>
          )}

          {/* 底部链接 */}
          <div className="mt-8 pt-6 border-t text-center space-y-3">
            <p className="text-sm text-gray-500">
              已有账号？
              <Link href="/auth/login" className="text-green-600 hover:underline ml-1">
                密码登录
              </Link>
              <span className="mx-2 text-gray-300">|</span>
              <Link href="/auth/register" className="text-green-600 hover:underline">
                手机号注册
              </Link>
            </p>
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
              ← 返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function WaveDots() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block w-2 h-2 bg-green-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </>
  );
}
