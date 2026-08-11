"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface PuzzleData {
  bg: string;
  piece: string;
  pieceY: number;
  correctX: number; // 正确 X 坐标（与后端 cookie 一致），用于前端判断对齐
  w: number;
}

interface PuzzleCaptchaProps {
  onVerified: (x: number) => void;
  onError?: (msg: string) => void;
  className?: string;
  /** 最大显示宽度（px）；不传或 0 则撑满容器 */
  maxWidth?: number;
}

// 前端对齐容差，与服务端 PUZZLE_TOLERANCE 保持一致（8px）
const CLIENT_TOLERANCE = 8;

const PIECE_W = 44; // 与后端 route.ts 保持一致
const PIECE_H = 44;

export default function PuzzleCaptcha({ onVerified, onError, className = "", maxWidth }: PuzzleCaptchaProps) {
  const [data, setData] = useState<PuzzleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragX, setDragX] = useState(0); // 拖拽偏移量（原始坐标 px，与后端 W 同尺度）
  const [dragging, setDragging] = useState(false);
  const [verified, setVerified] = useState(false);
  const [hint, setHint] = useState(""); // 未对齐时的轻提示
  const [scale, setScale] = useState(1); // 背景图实际显示宽度 / 数据宽度

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startDragXRef = useRef(0);
  const dragXRef = useRef(0); // 始终跟踪最新拖拽 X（解决 React 异步状态闭包过期问题）
  const correctXRef = useRef(-1); // 正确 X 坐标（来自接口返回）

  // 加载验证码图片
  const loadPuzzle = useCallback(async () => {
    setLoading(true);
    setDragX(0);
    dragXRef.current = 0; // 同步 ref
    setVerified(false);
    setHint("");
    try {
      const res = await fetch(`/api/captcha?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("加载失败");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      correctXRef.current = json.correctX; // 记录正确坐标
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

  // 监听背景图加载完成，计算缩放比例
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const onLoad = () => {
      // naturalWidth 是图片原始宽度（= data.w = 280）
      // offsetWidth 是实际显示宽度
      if (img.naturalWidth > 0 && img.offsetWidth > 0) {
        setScale(img.offsetWidth / img.naturalWidth);
      }
    };

    // 图片可能已加载完
    if (img.complete) {
      onLoad();
    } else {
      img.addEventListener("load", onLoad);
      return () => img.removeEventListener("load", onLoad);
    }
  }, [data]);

  // 窗口 resize 时重新计算缩放
  useEffect(() => {
    const onResize = () => {
      const img = imgRef.current;
      if (img?.complete && img.naturalWidth > 0 && img.offsetWidth > 0) {
        setScale(img.offsetWidth / img.naturalWidth);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ─── 拖拽逻辑（mouse + touch 统一） ───
  const handleDragStart = useCallback((clientX: number) => {
    if (verified || loading || !data) return;
    setDragging(true);
    setHint("");
    startXRef.current = clientX;
    startDragXRef.current = dragX;
  }, [verified, loading, data, dragX]);

  const handleDragMove = useCallback((clientX: number) => {
    if (!dragging || !data || !containerRef.current) return;
    const delta = clientX - startXRef.current;
    const sliderW = containerRef.current.clientWidth - 40; // 滑块可用宽度（减去滑块手柄宽）
    const maxDrag = data.w - PIECE_W - 10; // 留一点边距（原始坐标空间）
    const newX = Math.max(0, Math.min(startDragXRef.current + delta * (maxDrag / sliderW), maxDrag));
    setDragX(newX);
    dragXRef.current = newX; // 同步更新 ref，确保 handleDragEnd 能读到最新值
  }, [dragging, data]);

  const handleDragEnd = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    if (!data) return;

    const submitted = Math.round(dragXRef.current);
    // 前端判断是否与缺口对齐（与服务端容差一致）
    const isAligned = Math.abs(submitted - correctXRef.current) <= CLIENT_TOLERANCE;

    if (isAligned) {
      // 对齐：显示"验证成功"并锁定滑块
      setVerified(true);
      setHint("");
      onVerified(submitted);
    } else {
      // 未对齐：不显示成功，允许继续拖动，给轻提示
      setVerified(false);
      setHint("未对准缺口，请继续拖动");
      // 1.5s 后清除提示（不影响继续拖动）
      setTimeout(() => setHint(""), 1500);
    }
  }, [dragging, data, onVerified]);

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

  // Touch events — 阻止浏览器默认手势（滚动/滑动返回/缩放）
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handleDragStart(e.touches[0].clientX);
  };
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: TouchEvent) => {
      e.preventDefault(); // 阻止滚动
      handleDragMove(e.touches[0].clientX);
    };
    const onEnd = () => handleDragEnd();
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [dragging, handleDragMove, handleDragEnd]);

  if (loading) {
    return (
      <div className={`w-full rounded-lg border border-gray-200 bg-gray-50 ${className}`} style={{ touchAction: "none" }}>
        <div className="flex h-[160px] items-center justify-center text-sm text-gray-400">
          验证码加载中...
        </div>
      </div>
    );
  }

  if (!data) return null;

  // 拼图块在屏幕上的显示尺寸和位置（按 scale 缩放）
  const displayPieceW = PIECE_W * scale;
  const displayPieceH = PIECE_H * scale;
  const displayPieceY = data.pieceY * scale;
  const displayDragX = dragX * scale;

  return (
    <div
      className={`w-full select-none ${className}`}
      style={{ touchAction: "none", ...(maxWidth ? { maxWidth } : {}) }}
    >
      {/* 提示文字 */}
      <p className="mb-2 text-sm font-medium text-gray-700">
        请完成下方拼图验证后继续
      </p>

      {/* 图片区域 — 固定宽高比容器，确保缩放一致 */}
      <div
        className="relative overflow-hidden rounded-t-lg border border-b-0 border-gray-200 bg-gray-100"
        style={{ paddingBottom: `${(H / data.w) * 100}%`, touchAction: "none" }} // 160/280 ≈ 57.14%
      >
        {/* 背景图 — 绝对填充容器 */}
        <img
          ref={imgRef}
          src={data.bg}
          alt="验证码背景"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />

        {/* 拼图块 — 按 scale 缩放后的绝对定位 */}
        <div
          className="absolute cursor-grab active:cursor-grabbing"
          style={{
            left: displayDragX,
            top: displayPieceY,
            width: displayPieceW,
            height: displayPieceH,
          }}
        >
          <img
            src={data.piece}
            alt=""
            className="pointer-events-none block h-full w-full"
            draggable={false}
          />
        </div>

        {/* 刷新按钮 — 右上角小图标，不占布局 */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); loadPuzzle(); }}
          className="absolute right-1.5 top-1.5 z-10 rounded-full bg-black/20 p-1 text-white/80 backdrop-blur-[2px] transition-colors hover:bg-black/40 hover:text-white"
          title="刷新验证码"
          aria-label="刷新验证码"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 11-6.22-8.56" />
            <polyline points="21 3 21 9 15 9" />
          </svg>
        </button>
      </div>

      {/* 滑块区域 */}
      <div
        ref={containerRef}
        className={`relative flex h-10 ${verified ? "cursor-default" : "cursor-pointer"} items-center rounded-b-lg border border-gray-200 bg-gray-100 ${
          verified ? "bg-green-50" : ""
        }`}
        style={{ touchAction: "none" }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {/* 滑块轨道左侧图标 */}
        <div
          className={`absolute left-0 flex h-full w-10 items-center justify-center rounded-l-md transition-colors ${
            dragging ? "bg-primary-600 text-white" : verified ? "bg-green-500 text-white" : "bg-white text-gray-400 shadow-sm border-r border-gray-200"
          }`}
          style={dragging || verified ? { left: `${(dragX / (data.w - PIECE_W)) * (100 - (40 / (containerRef.current?.clientWidth ?? 280) * 100))}%` } : {}}
        >
          {verified ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
            </svg>
          )}
        </div>

        {/* 提示文字 */}
        <span className={`pointer-events-none w-full text-center text-sm ${
          verified ? "text-green-600 font-medium" : hint ? "text-amber-500" : "text-gray-400"
        }`}>
          {verified ? "验证成功" : dragging ? "" : hint || "拖动滑块完成拼图"}
        </span>
      </div>
    </div>
  );
}

// 后端背景图的固定高度（用于计算宽高比）
const H = 160;
