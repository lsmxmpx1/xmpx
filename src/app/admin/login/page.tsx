"use client";

import { useState } from "react";
import { adminLogin } from "../actions";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await adminLogin(new FormData(e.currentTarget));
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
    // 成功时 server action 内部 redirect，不会走到这里
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">厦门培训网 · 管理后台</h1>
          <p className="text-gray-500 text-sm mt-2">请使用管理员账号登录</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">管理员账号</label>
            <input
              name="email"
              type="email"
              required
              placeholder="admin@xmpx.cn"
              defaultValue="admin@xmpx.cn"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              name="password"
              type="password"
              required
              placeholder="请输入密码"
              className="input-field"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition disabled:opacity-50"
          >
            {loading ? "登录中..." : "登录后台"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          管理地址：/admin　·　如需前台请访问网站首页
        </p>
      </div>
    </div>
  );
}
