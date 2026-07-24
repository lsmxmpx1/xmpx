"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PuzzleCaptcha from "@/components/PuzzleCaptcha";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [puzzleReady, setPuzzleReady] = useState(false); // 用户已完成拼图拖拽
  const [puzzleX, setPuzzleX] = useState(0); // 拼图提交的 X 坐标
  const puzzleRef = useRef<{ reload: () => void } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!puzzleReady) {
      setError("请先完成拼图验证");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email: email || undefined,
        phone: phone || undefined,
        password,
        confirmPassword,
        puzzleX, // 拼图滑块验证码：提交拖拽的 X 坐标
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "注册失败");
      setPuzzleReady(false);
      // 刷新验证码（通过 key 重挂载）
      setPuzzleX(0);
      setLoading(false);
    } else {
      router.push("/auth/login?registered=true");
    }
  }

  /** 拼图组件回调：用户完成拖拽 */
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
          <input
            type="password"
            placeholder="请再次输入密码确认"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field"
            required
            minLength={6}
          />

          {/* 拼图滑块验证码 */}
          <PuzzleCaptcha
            key={puzzleX === 0 && !loading ? "puzzle" : `puzzle-${Date.now()}`}
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
