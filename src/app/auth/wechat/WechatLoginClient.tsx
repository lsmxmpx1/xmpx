"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function WechatLoginPageInner() {
  const router = useRouter();
  const [status, setStatus] = useState<
    | "loading" | "idle" | "scanning" | "confirming" | "success"
    | "need_bind" | "error"
  >("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [scene, setScene] = useState<string | null>(null);
  const [phoneSuffix, setPhoneSuffix] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expired, setExpired] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  const [skipQr, setSkipQr] = useState(false); // 微信内 OAuth 回调返回时跳过加载二维码

  // 检测是否为开发环境 / 未配置凭据
  useEffect(() => {
    setIsDevMode(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  }, []);

  // 微信内浏览器 OAuth 回调返回（?status=success）：直接进入轮询，读取 cookie 完成登录
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("status") === "success") {
      setSkipQr(true);
      setStatus("idle");
    }
  }, []);

  // 加载公众号二维码（生产模式，PC 扫码）
  useEffect(() => {
    if (isDevMode || skipQr) {
      setStatus("idle");
      return;
    }

    let cancelled = false;
    async function loadQrUrl() {
      try {
        const res = await fetch("/api/auth/wechat/qr-url");
        if (!res.ok) throw new Error("获取失败");
        const data = await res.json();
        if (cancelled) return;
        if (data.configured && data.qrUrl) {
          setQrUrl(data.qrUrl);
          setScene(data.scene);
          setStatus("idle");
          // 二维码有效期 5 分钟后标记过期
          setTimeout(() => {
            if (!cancelled) setExpired(true);
          }, 5 * 60 * 1000);
        } else {
          // 后端返回未配置 → 降级到开发模拟
          setIsDevMode(true);
          setStatus("idle");
        }
      } catch {
        if (!cancelled) {
          setIsDevMode(true);
          setStatus("idle");
        }
      }
    }
    loadQrUrl();
    return () => { cancelled = true; };
  }, [isDevMode, skipQr]);

  // 轮询检测登录结果：
  //   - PC 扫码流程：带 scene 参数，读服务端扫码态
  //   - 微信内 OAuth 返回：不带 scene，读 cookie（wx_login_success / wx_user_id）
  useEffect(() => {
    if (status !== "idle") return;
    const poll = setInterval(async () => {
      try {
        const qs = scene ? `?scene=${encodeURIComponent(scene)}` : "";
        const res = await fetch(`/api/auth/wechat/poll-status${qs}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.userId) {
          clearInterval(poll);
          setPhoneSuffix(data.phone || "");
          if (data.needBindPhone) {
            setStatus("need_bind");
          } else {
            setStatus("confirming");
            const loginRes = await signIn("wechat-callback", {
              redirect: false,
              userId: data.userId,
            });
            if (!loginRes?.error) {
              setStatus("success");
              setTimeout(() => {
                router.push("/");
                router.refresh();
              }, 800);
            } else {
              setErrorMsg("自动登录失败，请手动登录");
              setStatus("error");
            }
          }
        }
      } catch {
        /* ignore poll errors */
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [status, scene, router]);

  // 开发环境：模拟扫码（直接建立本地会话）
  const simulateScan = useCallback(async () => {
    if (expired) return;
    setStatus("scanning");
    await new Promise((r) => setTimeout(r, 1200));
    setStatus("confirming");

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
        throw new Error((data as { error?: string }).error || "回调失败");
      }

      if (data.needBindPhone) {
        setStatus("need_bind");
      } else {
        // 开发模拟：直接建立会话
        const loginRes = await signIn("wechat-callback", {
          redirect: false,
          userId: data.userId,
        });
        if (loginRes?.error) throw new Error("登录失败");
        setStatus("success");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 800);
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "微信授权失败，请重试");
    }
  }, [expired, router]);

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // 发送短信验证码（绑定手机号流程）
  async function sendSmsCode() {
    const phoneEl = document.getElementById("bindPhone") as HTMLInputElement | null;
    const phone = phoneEl?.value || "";
    if (!phone || !/^1\d{10}$/.test(phone)) {
      setErrorMsg("请输入正确的手机号");
      return;
    }
    setSending(true);
    try {
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
      setErrorMsg(err instanceof Error ? err.message : "发送失败");
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

      const bindRes = await fetch("/api/auth/bind-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: smsCode }),
      });
      const bindData = await bindRes.json();
      if (!bindRes.ok) throw new Error(bindData.error);

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
      setErrorMsg(err instanceof Error ? err.message : "绑定失败");
    }
    setLoading(false);
  }

  // 刷新二维码
  function refreshQr() {
    setExpired(false);
    setStatus("loading");
    setQrUrl(null);
    setScene(null);
    window.location.reload();
  }

  // ─────────────── 渲染：二维码区域 ───────────────
  const renderQrArea = () => {
    // 真实公众号二维码（图片方式，用户用微信扫一扫）
    if (qrUrl && status === "idle" && !expired) {
      return (
        <div className="text-center">
          <div className="inline-block bg-white border-2 border-green-200 rounded-xl p-3 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="微信扫码登录二维码"
              width={220}
              height={220}
              className="block mx-auto"
            />
          </div>
          <div className="flex items-center justify-center gap-2 text-green-600">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm">等待微信扫码...</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            请使用微信「扫一扫」扫描上方二维码（需关注本公众号）
          </p>
        </div>
      );
    }

    // 模拟二维码（开发环境 / 未配置凭据时）
    if ((isDevMode || !qrUrl) && status === "idle" && !expired) {
      return (
        <div className="text-center">
          {isDevMode && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <p className="text-amber-700 text-xs mb-2 font-medium">开发环境（未配置公众号）</p>
              <button
                onClick={simulateScan}
                className="bg-amber-500 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-amber-600 transition-colors"
              >
                📱 模拟微信扫码
              </button>
            </div>
          )}

          {!isDevMode && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-yellow-700 text-xs">⚠️ 公众号未配置</p>
              <p className="text-xs text-gray-400 mt-1">请在环境变量设置 WECHAT_MP_APPID / APPSECRET / TOKEN</p>
            </div>
          )}

          {/* 静态装饰性二维码 */}
          <div className="inline-block bg-white border-2 border-gray-200 rounded-xl p-4 mb-4 opacity-60">
            <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto">
              <rect x="20" y="20" width="50" height="50" rx="6" fill="#07C160" />
              <rect x="24" y="24" width="42" height="42" rx="4" fill="white" />
              <rect x="30" y="30" width="26" height="26" rx="2" fill="#07C160" />

              <rect x="130" y="20" width="50" height="50" rx="6" fill="#07C160" />
              <rect x="134" y="24" width="42" height="42" rx="4" fill="white" />
              <rect x="140" y="30" width="26" height="26" rx="2" fill="#07C160" />

              <rect x="20" y="130" width="50" height="50" rx="6" fill="#07C160" />
              <rect x="24" y="134" width="42" height="42" rx="4" fill="white" />
              <rect x="30" y="140" width="26" height="26" rx="2" fill="#07C160" />

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
              <circle cx="100" cy="100" r="16" fill="#07C160" opacity="0.9" />
              <path d="M92 95h3v10h-3zM99 95v4h3v-4h3v10h-3v-4h-3v4h-3V95h3zM108 95c2 0 3.5 1.2 3.5 3.5s-1.5 3.5-3.5 3.5h-1v3h-3v-10h4z" fill="white" />
            </svg>
          </div>
          {!isDevMode && (
            <p className="text-xs text-gray-400 mt-2">配置公众号后即可使用真实扫码</p>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-50 rounded-full mb-3">
              <svg className="w-8 h-8 text-green-600" viewBox="0 0 48 48" fill="currentColor">
                <path d="M18.8 17.6c-.8-2.4-3-4-5.6-4-3.3 0-6 2.7-6 6s2.7 6 6 6c2.6 0 4.8-1.6 5.6-4h5.4l1.4 3 1.4-3h3.6v-4h-11.8zm-5.6 3.8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM33.6 24c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm0-3.2c1.5 0 2.8-1.3 2.8-2.8s-1.3-2.8-2.8-2.8-2.8 1.3-2.8 2.8 1.3 2.8 2.8 2.8zM20.8 26.4h-5.6l-1.4-3-1.4 3H7.2v4h13.6v-4z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">微信扫码登录</h1>
            <p className="text-gray-500 text-sm mt-1">
              使用微信扫一扫快速登录
            </p>
          </div>

          {/* Loading 状态 */}
          {status === "loading" && (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mb-4" />
              <p className="text-gray-500 text-sm">正在加载二维码...</p>
            </div>
          )}

          {/* 二维码区域 */}
          {(status === "idle" || (status === "loading" && isDevMode)) && renderQrArea()}

          {/* 扫码中 */}
          {status === "scanning" && (
            <div className="text-center py-8">
              <div className="inline-block w-16 h-16 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mb-4" />
              <p className="text-gray-600">检测到扫码，请在手机上确认</p>
            </div>
          )}

          {/* 确认中 */}
          {status === "confirming" && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">登录成功，正在跳转...</p>
            </div>
          )}

          {/* 需要绑定手机号 */}
          {status === "need_bind" && (
            <div>
              <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 rounded-full mb-2">
                  <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-base font-semibold text-gray-900">绑定手机号</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  微信授权成功，请绑定手机号完成注册
                </p>
              </div>

              <form onSubmit={handleBindPhone} className="space-y-3">
                <input id="bindPhone" type="tel" maxLength={11} placeholder="请输入手机号" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-sm" required />

                <div className="flex gap-2">
                  <input type="text" maxLength={6} placeholder="验证码" value={smsCode} onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ""))} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-sm" required />
                  <button type="button" onClick={sendSmsCode} disabled={sending || countdown > 0} className="px-3 py-2.5 bg-green-50 text-green-600 font-medium rounded-xl hover:bg-green-100 transition disabled:opacity-50 whitespace-nowrap text-sm">
                    {countdown > 0 ? `${countdown}s` : sending ? "..." : "获取验证码"}
                  </button>
                </div>

                {errorMsg && <p className="text-red-500 text-xs">{errorMsg}</p>}

                <button type="submit" disabled={loading} className="w-full bg-green-600 text-white font-medium py-2.5 rounded-xl hover:bg-green-700 transition disabled:opacity-50 text-sm">
                  {loading ? "绑定中..." : "绑定并登录"}
                </button>
              </form>
            </div>
          )}

          {/* 二维码过期 */}
          {expired && status !== "need_bind" && status !== "scanning" && status !== "confirming" && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 rounded-full mb-3">
                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 text-sm mb-1">二维码已过期</p>
              <button onClick={refreshQr} className="mt-3 bg-green-600 text-white px-5 py-2 rounded-xl hover:bg-green-700 transition text-sm">
                刷新二维码
              </button>
            </div>
          )}

          {/* 错误状态 */}
          {status === "error" && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-full mb-3">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-600 text-sm">{errorMsg || "授权失败"}</p>
              <button
                onClick={() => { setStatus("idle"); setExpired(false); setErrorMsg(""); }}
                className="mt-3 text-green-600 hover:underline text-sm"
              >重新扫码</button>
            </div>
          )}

          {/* 底部导航 */}
          <div className="mt-6 pt-4 border-t text-center space-y-2">
            <p className="text-sm text-gray-500">
              其他登录方式：
              <Link href="/auth/login" className="text-primary-600 hover:underline ml-1">账号密码</Link>
              <span className="mx-1 text-gray-300">|</span>
              <Link href="/auth/register" className="text-primary-600 hover:underline">手机号注册</Link>
            </p>
            <Link href="/" className="block text-sm text-gray-400 hover:text-gray-600">← 返回首页</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WechatLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    }>
      <WechatLoginPageInner />
    </Suspense>
  );
}
