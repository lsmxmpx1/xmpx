"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { changePassword } from "@/app/dashboard/profile/actions";
import { sendBindEmailCode, bindEmail } from "./actions";

type Props = {
  email: string | null;
  phone: string | null;
  name: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SecurityForm({ email, phone, name }: Props) {
  const router = useRouter();

  // ----- 修改密码（复用 profile/actions 的 changePassword）-----
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdPending, startPwd] = useTransition();
  const [pwdDone, setPwdDone] = useState(false);
  const [pwdErr, setPwdErr] = useState("");

  // ----- 邮箱换绑（带验证码）-----
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailPending, startEmail] = useTransition();
  const [emailDone, setEmailDone] = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const [emailInfo, setEmailInfo] = useState("");
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdErr("");
    setPwdDone(false);
    if (newPwd.length < 6) {
      setPwdErr("新密码至少 6 位");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdErr("两次输入的密码不一致");
      return;
    }
    startPwd(async () => {
      const fd = new FormData();
      fd.set("oldPassword", oldPwd);
      fd.set("newPassword", newPwd);
      fd.set("confirmPassword", confirmPwd);
      const res = await changePassword(fd);
      if (res.error) {
        setPwdErr(res.error);
        return;
      }
      setPwdDone(true);
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setTimeout(() => setPwdDone(false), 3000);
    });
  }

  async function handleSendCode() {
    if (!newEmail || !EMAIL_RE.test(newEmail)) {
      setEmailErr("请输入正确的邮箱");
      return;
    }
    setEmailErr("");
    setEmailInfo("");
    setSending(true);
    try {
      const res = await sendBindEmailCode(newEmail);
      if (res.error) {
        setEmailErr(res.error);
        return;
      }
      setCountdown(60);
      setEmailInfo(
        "验证码已发送，请查收邮箱（5 分钟内有效）" +
          (res.debugCode ? `。开发模式验证码：${res.debugCode}` : ""),
      );
    } catch {
      setEmailErr("发送失败，请稍后重试");
    } finally {
      setSending(false);
    }
  }

  function handleBindEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailErr("");
    setEmailInfo("");
    if (!code) {
      setEmailErr("请输入验证码");
      return;
    }
    startEmail(async () => {
      const res = await bindEmail(newEmail, code);
      if (res.error) {
        setEmailErr(res.error);
        return;
      }
      setEmailDone(true);
      setEmailInfo("邮箱已更新成功");
      setNewEmail("");
      setCode("");
      router.refresh();
      setTimeout(() => setEmailDone(false), 3000);
    });
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* 面包屑 */}
      <div className="mb-6 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-blue-600">
          用户中心
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-800 font-medium">账号安全</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">账号安全</h1>

      {/* 修改密码 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">修改密码</h2>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm text-gray-600 mb-1">当前密码</label>
            <input
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
              type="password"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">新密码</label>
            <input
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              type="password"
              required
              minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="至少 6 位"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">确认新密码</label>
            <input
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              type="password"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="再次输入新密码"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={pwdPending}
              className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {pwdPending ? "修改中…" : "修改密码"}
            </button>
            {pwdDone && <span className="text-green-600 text-sm">✓ 密码已更新</span>}
          </div>
          {pwdErr && <p className="text-red-600 text-sm">{pwdErr}</p>}
        </form>
      </div>

      {/* 邮箱绑定 / 换绑 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-1">邮箱管理</h2>
        <p className="text-sm text-gray-500 mb-4">
          当前邮箱：
          {email ? (
            <span className="text-gray-800 font-medium">{email}</span>
          ) : (
            <span className="text-amber-600 font-medium">未绑定</span>
          )}
        </p>

        <form onSubmit={handleBindEmail} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm text-gray-600 mb-1">新邮箱</label>
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="请输入要绑定的邮箱"
            />
          </div>
          <div className="flex gap-3">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              type="text"
              maxLength={6}
              className="input-field flex-1"
              placeholder="请输入邮箱验证码"
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={sending || countdown > 0}
              className="px-4 py-3 bg-primary-50 text-primary-600 font-medium rounded-xl hover:bg-primary-100 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
            >
              {countdown > 0 ? `${countdown}s` : sending ? "发送中" : "获取验证码"}
            </button>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={emailPending}
              className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {emailPending ? "处理中…" : "确认更换"}
            </button>
            {emailDone && <span className="text-green-600 text-sm">✓ 邮箱已更新</span>}
          </div>
          {emailErr && <p className="text-red-600 text-sm">{emailErr}</p>}
          {emailInfo && <p className="text-green-600 text-sm">{emailInfo}</p>}
        </form>
        <p className="text-xs text-gray-400 mt-4">
          为保证账号安全，更换邮箱需先验证新邮箱（验证码 5 分钟内有效）。
        </p>
      </div>
    </div>
  );
}
