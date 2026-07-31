"use client";

import { useEffect, useState, useRef, useCallback } from "react";

/**
 * 进入文章详情页时记录一次浏览量（客户端挂载后调用，避免 SSR 阶段写库）。
 * 同时渲染浏览数文本：SSR 阶段显示服务端值，客户端挂载后 +1（含本次访问）。
 */
export default function ArticleViewTracker({
  id,
  initialViews,
}: {
  id: string;
  initialViews: number;
}) {
  const [views, setViews] = useState(initialViews);
  const tracked = useRef(false);

  const track = useCallback(async () => {
    if (tracked.current) return;
    tracked.current = true;
    try {
      const res = await fetch(`/api/articles/${id}/view`, { method: "POST" });
      if (res.ok) {
        setViews((v) => v + 1);
      }
    } catch {
      // 网络异常时保持原值
    }
  }, [id]);

  useEffect(() => {
    track();
  }, [track]);

  return <span>{views} 次浏览</span>;
}
