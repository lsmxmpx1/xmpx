"use client";

import { useEffect } from "react";

// 进入详情页时记录一次浏览量（客户端挂载后调用，避免 SSR 阶段写库）
export default function QuestionViewTracker({ id }: { id: string }) {
  useEffect(() => {
    fetch(`/api/questions/${id}/view`, { method: "POST" }).catch(() => {});
  }, [id]);
  return null;
}
