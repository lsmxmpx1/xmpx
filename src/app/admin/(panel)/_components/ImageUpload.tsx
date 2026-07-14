"use client";

import { useRef, useState } from "react";

/**
 * 可复用图片上传组件
 * - 选择文件后先读取像素尺寸并按广告位（position）或指定比例（ratio）做尺寸校验
 *   比例偏差 > 30% 直接阻止上传；偏差 15%~30% 仅警告但仍允许
 * - 校验通过后 POST /api/upload，成功后拿到 URL 存入隐藏 input[name]，随表单提交
 * - 支持预览、更换、清除
 */

type SizeHint = { w: number; h: number; ratio: number; text: string };

// 各广告位建议尺寸（宽×高）与宽高比，用于文字提醒与上传校验
export const AD_SIZE_HINTS: Record<string, SizeHint> = {
  HOME_TOP: { w: 1200, h: 300, ratio: 4, text: "首页顶部横幅，建议 1200×300（宽幅 4:1）" },
  HOME_BANNER: { w: 1200, h: 300, ratio: 4, text: "首页顶部通栏，建议 1200×300（宽幅 4:1）" },
  HOME_SIDEBAR: { w: 300, h: 400, ratio: 0.75, text: "首页侧栏，建议 300×400（竖幅 3:4）" },
  HOME_FEATURED: { w: 300, h: 400, ratio: 0.75, text: "首页侧栏推荐，建议 300×400（竖幅 3:4）" },
  COURSE_LIST: { w: 1200, h: 200, ratio: 6, text: "课程列表页，建议 1200×200（宽幅 6:1）" },
  INSTITUTION_LIST: { w: 1200, h: 200, ratio: 6, text: "机构列表页，建议 1200×200（宽幅 6:1）" },
  LISTING_BOOST: { w: 1200, h: 200, ratio: 6, text: "机构列表置顶，建议 1200×200（宽幅 6:1）" },
  ARTICLE_LIST: { w: 1200, h: 200, ratio: 6, text: "资讯列表页，建议 1200×200（宽幅 6:1）" },
};

export default function ImageUpload({
  name,
  defaultValue = "",
  label = "图片",
  position,
  ratio,
  hint,
}: {
  name: string;
  defaultValue?: string | null;
  label?: string;
  position?: string;
  ratio?: number;
  hint?: string;
}) {
  const sizeHint = position ? AD_SIZE_HINTS[position] : null;
  const expectedRatio = sizeHint ? sizeHint.ratio : ratio;
  const hintText = sizeHint ? sizeHint.text : hint;

  const [url, setUrl] = useState<string>(defaultValue || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [dimText, setDimText] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 读取图片真实像素尺寸
  function readSize(file: File): Promise<{ w: number; h: number } | null> {
    return new Promise((resolve) => {
      const objUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        resolve({ w: img.naturalWidth, h: img.naturalHeight });
        URL.revokeObjectURL(objUrl);
      };
      img.onerror = () => {
        resolve(null);
        URL.revokeObjectURL(objUrl);
      };
      img.src = objUrl;
    });
  }

  // 按比例校验：偏差 > 30% 报错阻止；15%~30% 警告
  function validate(w: number, h: number): { err: string | null; war: string | null } {
    if (!expectedRatio) return { err: null, war: null };
    const actual = w / h;
    const dev = Math.abs(actual - expectedRatio) / expectedRatio;
    const sizeStr = sizeHint ? `${sizeHint.w}×${sizeHint.h}` : "";
    if (dev > 0.3) {
      return {
        err: `图片比例不合适（当前 ${w}×${h}，约 ${actual.toFixed(2)}:1；建议约 ${expectedRatio.toFixed(2)}:1，建议尺寸 ${sizeStr}），可能影响展示效果`,
        war: null,
      };
    }
    if (dev > 0.15) {
      return {
        err: null,
        war: `图片比例略有偏差（当前 ${w}×${h}），建议尺寸 ${sizeStr}，可能影响展示效果`,
      };
    }
    return { err: null, war: null };
  }

  async function handleFile(file: File) {
    setError(null);
    setWarn(null);
    setUploading(true);
    try {
      // 先校验尺寸，比例明显不符则阻止上传
      const dim = await readSize(file);
      if (dim) {
        const v = validate(dim.w, dim.h);
        setDimText(`${dim.w}×${dim.h}`);
        if (v.err) {
          setError(v.err);
          setUploading(false);
          return;
        }
        if (v.war) setWarn(v.war);
      }
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "上传失败");
      }
      setUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function clear() {
    setUrl("");
    setDimText(null);
    setWarn(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="mb-1 block text-sm text-gray-600">{label}</label>

      {hintText && (
        <p className="mb-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-600">
          尺寸建议：{hintText}
        </p>
      )}

      {/* 隐藏字段：真正提交给表单的值 */}
      <input type="hidden" name={name} value={url} />

      <div className="flex items-start gap-3">
        {url ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="预览"
              className="h-24 w-40 rounded-lg border border-gray-200 object-cover"
            />
            <button
              type="button"
              onClick={clear}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow hover:bg-red-600"
              title="移除图片"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="flex h-24 w-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-xs text-gray-400">
            暂无图片
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {uploading ? "上传中..." : url ? "更换图片" : "选择图片上传"}
          </button>
          <span className="text-xs text-gray-400">支持 JPG/PNG/WebP/GIF，≤5MB</span>
          {dimText && <span className="text-xs text-gray-500">当前尺寸：{dimText}</span>}
          {warn && <span className="text-xs text-amber-600">{warn}</span>}
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onChange}
        />
      </div>
    </div>
  );
}
