"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 记录到控制台便于定位（生产环境也可接上报）
    console.error("页面渲染异常：", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">页面出现了一点问题</h1>
        <p className="text-sm text-gray-500 mb-4">
          我们正在排查。你可以点击下方按钮重试，或返回首页。
        </p>
        {error?.message && (
          <pre className="text-left text-xs bg-gray-50 border border-gray-100 rounded-lg p-3 mb-4 overflow-auto text-red-600">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            重试
          </button>
          <a href="/" className="btn-secondary px-5 py-2.5 text-sm">
            返回首页
          </a>
        </div>
      </div>
    </div>
  );
}
