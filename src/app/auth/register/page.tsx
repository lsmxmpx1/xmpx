"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PuzzleCaptcha from "@/components/PuzzleCaptcha";

const ROLE_TEXT: Record<string, { title: string; desc: string }> = {
  institution: {
    title: "注册机构账号",
    desc: "注册后可在用户中心开通机构身份，发布课程、接收咨询线索",
  },
  teacher: {
    title: "注册老师账号",
    desc: "注册后可在用户中心开通老师身份，建立个人专业主页",
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "";
  const roleInfo = ROLE_TEXT[role] || null;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [puzzleReady, setPuzzleReady] = useState(false); // 用户已拖到正确位置
  const [puzzleX, setPuzzleX] = useState(0); // 拼图提交的 X 坐标
  const [captchaKey, setCaptchaKey] = useState("puzzle"); // 验证码组件 key，仅注册失败时刷新
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!puzzleReady) {
      setError("请先完成拼图验证");
      return;
    }

    if (!emailCode) {
      setError("请输入邮箱验证码");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone: phone || undefined,
        password,
        confirmPassword,
        puzzleX, // 拼图滑块验证码：提交拖拽的 X 坐标
        emailCode, // 邮箱验证码
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "注册失败");
      setPuzzleReady(false);
      setPuzzleX(0);
      // 刷新验证码（通过 key 变更强制重挂载，拿到新 correctX）
      setCaptchaKey(`puzzle-${Date.now()}`);
      setLoading(false);
    } else {
      router.push("/auth/login?registered=true");
    }
  }

  /** 获取邮箱验证码 */
  async function handleSendCode() {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("请输入正确的邮箱");
      return;
    }
    setError("");
    setInfo("");
    setSendingCode(true);
    try {
      const res = await fetch("/api/email/send-register-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "发送失败");
      setCountdown(60);
      const devHint = data.debugCode ? `（开发模式验证码：${data.debugCode}）` : "";
      setInfo(`验证码已发送，请查收邮箱（5 分钟内有效）${devHint}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "发送失败");
    }
    setSendingCode(false);
  }

  /** 拼图组件回调：用户拖到正确位置才触发 */
  const handlePuzzleVerified = useCallback((x: number) => {
    setPuzzleX(x);
    setPuzzleReady(true);
  }, []);

  /** 拼图组件错误回调 */
  const handlePuzzleError = useCallback((msg: string) => {
    console.error("[puzzle]", msg);
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-2">
          {roleInfo?.title || "创建账号"}
        </h1>
        <p className="text-gray-500 text-center mb-8">
          {roleInfo?.desc || "注册厦门培训网，开启学习之旅"}
        </p>
        {roleInfo && (
          <div className="mb-6 rounded-xl bg-primary-50 border border-primary-200 px-4 py-3 text-sm text-primary-700 text-center">
            注册完成后，请前往
            <Link href="/dashboard" className="font-medium underline">用户中心</Link>
            开通
            {role === "institution" ? "机构" : "老师"}身份 →
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
        )}
        {info && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">{info}</div>
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
            required
          />
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="请输入邮箱验证码"
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
              className="input-field flex-1"
              maxLength={6}
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
          <input
            type="password"
            placeholder="请再次输入密码确认"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field"
            required
            minLength={6}
          />

          {/* 拼图滑块验证码 — key 仅在需要强制刷新时才变（注册失败后） */}
          <PuzzleCaptcha
            key={captchaKey}
            onVerified={handlePuzzleVerified}
            onError={handlePuzzleError}
          />

          <button type="submit" disabled={loading || !puzzleReady} className="btn-primary w-full py-3 text-base">
            {loading ? "注册中..." : !puzzleReady ? "请先完成上方拼图验证" : "注册"}
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
