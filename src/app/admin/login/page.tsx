"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    // 使用客户端 signIn（next-auth/react），避免在 Server Action 内调用
    // 服务端 signIn 导致的内部请求挂起问题（会一直卡在“登录中”）。
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("账号或密码错误");
      setLoading(false);
    } else {
      router.push("/admin");
      router.refresh();
    }
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
