"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface PuzzleData {
  bg: string;
  piece: string;
  pieceY: number;
  w: number;
}

interface PuzzleCaptchaProps {
  onVerified: (x: number) => void;
  onError?: (msg: string) => void;
  className?: string;
}

const PIECE_W = 44; // 与后端 route.ts 保持一致
const PIECE_H = 44;

export default function PuzzleCaptcha({ onVerified, onError, className = "" }: PuzzleCaptchaProps) {
  const [data, setData] = useState<PuzzleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragX, setDragX] = useState(0); // 拖拽偏移量（px）
  const [dragging, setDragging] = useState(false);
  const [verified, setVerified] = useState(false);
  const [failed, setFailed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startDragXRef = useRef(0);

  // 加载验证码图片
  const loadPuzzle = useCallback(async () => {
    setLoading(true);
    setDragX(0);
    setVerified(false);
    setFailed(false);
    try {
      const res = await fetch(`/api/captcha?t=${Date.now()}`);
      if (!res.ok) throw new Error("加载失败");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "验证码加载失败");
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    loadPuzzle();
  }, [loadPuzzle]);

  // ─── 拖拽逻辑（mouse + touch 统一） ───
  const handleDragStart = useCallback((clientX: number) => {
    if (verified || loading || !data) return;
    setDragging(true);
    setFailed(false);
    startXRef.current = clientX;
    startDragXRef.current = dragX;
  }, [verified, loading, data, dragX]);

  const handleDragMove = useCallback((clientX: number) => {
    if (!dragging || !data || !containerRef.current) return;
    const delta = clientX - startXRef.current;
    const sliderW = containerRef.current.clientWidth - PIECE_W; // 最大可拖拽距离 ≈ 背景宽度 - 拼图块宽
    const maxDrag = data.w - PIECE_W - 10; // 留一点边距
    const newX = Math.max(0, Math.min(startDragXRef.current + delta * (maxDrag / sliderW), maxDrag));
    setDragX(newX);
  }, [dragging, data]);

  const handleDragEnd = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    if (!data) return;

    // 提交验证
    onVerified(Math.round(dragX));
  }, [dragging, data, dragX, onVerified]);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX);
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => handleDragMove(e.clientX);
    const onUp = () => handleDragEnd();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, handleDragMove, handleDragEnd]);

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handleDragStart(e.touches[0].clientX);
  };
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientX);
    const onEnd = () => handleDragEnd();
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [dragging, handleDragMove, handleDragEnd]);

  // 外部调用：标记验证结果
  useEffect(() => {
    if (failed) {
      // 失败后自动重置位置，允许重试
      const timer = setTimeout(() => setDragX(0), 600);
      return () => clearTimeout(timer);
    }
  }, [failed]);

  /** 标记验证通过/失败（由父组件调用） */
  const markResult = useCallback((success: boolean) => {
    if (success) {
      setVerified(true);
    } else {
      setFailed(true);
    }
  }, []);

  // 暴露方法给父组件用 ref
  // （简化方案：直接导出 reload 函数供外部使用）
  // 通过一个简单的 key-based refresh 机制

  if (loading) {
    return (
      <div className={`w-full rounded-lg border border-gray-200 bg-gray-50 ${className}`}>
        <div className="flex h-[160px] items-center justify-center text-sm text-gray-400">
          验证码加载中...
        </div>
      </div>
    );
  }

  if (!data) return null;

  // 计算拼图块在背景上的显示位置（按比例缩放）
  const displayScale = 1; // 背景图 CSS 宽度 / 数据宽度

  return (
    <div className={`w-full select-none ${className}`}>
      {/* 提示文字 */}
      <p className="mb-2 text-sm font-medium text-gray-700">
        请完成下方拼图验证后继续
      </p>

      {/* 图片区域 */}
      <div className="relative overflow-hidden rounded-t-lg border border-b-0 border-gray-200">
        <img
          src={data.bg}
          alt="验证码背景"
          className="block h-auto w-full"
          draggable={false}
        />
        {/* 拼图块 */}
        <div
          className="absolute cursor-grab active:cursor-grabbing"
          style={{
            left: dragX * displayScale,
            top: data.pieceY,
            width: PIECE_W,
            height: PIECE_H,
          }}
        >
          <img
            src={data.piece}
            alt=""
            className="pointer-events-none block h-full w-full"
            draggable={false}
            style={{ filter: failed ? "grayscale(100%)" : undefined }}
          />
        </div>
        {/* 刷新按钮 */}
        <button
          type="button"
          onClick={loadPuzzle}
          className="absolute right-2 top-2 rounded bg-black/30 p-1.5 text-white transition hover:bg-black/50"
          title="刷新验证码"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 11-6.22-8.56" />
            <polyline points="21 3 21 9 15 9" />
          </svg>
        </button>
      </div>

      {/* 滑块区域 */}
      <div
        ref={containerRef}
        className={`relative flex h-10 cursor-pointer items-center rounded-b-lg border border-gray-200 bg-gray-100 ${
          verified ? "bg-green-50" : failed ? "bg-red-50" : ""
        }`}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {/* 滑块轨道左侧图标 */}
        <div className={`absolute left-0 flex h-full w-10 items-center justify-center rounded-l-md transition-colors ${
          dragging ? "bg-primary-600 text-white" : verified ? "bg-green-500 text-white" : failed ? "bg-red-500 text-white" : "bg-white text-gray-400"
        }`}
        style={dragging || verified || failed ? { left: `${(dragX / (data.w - PIECE_W)) * 100}%` } : {}}
        >
          {verified ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : failed ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
            </svg>
          )}
        </div>

        {/* 提示文字 */}
        <span className={`pointer-events-none w-full text-center text-sm ${
          verified ? "text-green-600 font-medium" : failed ? "text-red-500" : "text-gray-400"
        }`}>
          {verified ? "验证成功" : failed ? "验证失败，请重试" : dragging ? "" : "拖动滑块完成拼图"}
        </span>
      </div>
    </div>
  );
}

/** 给父组件用的刷新方法（通过 key 重挂载实现更简单，这里保留接口） */
export type PuzzleCaptchaHandle = {
  reload: () => void;
};
