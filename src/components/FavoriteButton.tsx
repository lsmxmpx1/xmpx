"use client";

import { useState, useEffect } from "react";

interface FavoriteButtonProps {
  courseId?: string;
  institutionId?: string;
  /** initial favorited state (from server) */
  initialFavorited?: boolean;
  variant?: "button" | "icon";
}

export default function FavoriteButton({
  courseId,
  institutionId,
  initialFavorited = false,
  variant = "button",
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  async function toggleFavorite() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: courseId || undefined,
          institutionId: institutionId || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFavorited(data.favorited);
      } else {
        const data = await res.json();
        setError(data.error || "操作失败");
      }
    } catch {
      setError("网络错误");
    }

    setLoading(false);
  }

  if (variant === "icon") {
    return (
      <button
        onClick={toggleFavorite}
        disabled={loading}
        title={favorited ? "取消收藏" : "收藏"}
        className={`text-2xl transition-transform hover:scale-110 disabled:opacity-50 ${
          favorited ? "text-red-500" : "text-gray-300"
        }`}
      >
        {favorited ? "❤️" : "🤍"}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={toggleFavorite}
        disabled={loading}
        className={
          favorited
            ? "btn-secondary border-red-200 text-red-600 hover:bg-red-50"
            : "btn-secondary"
        }
      >
        {loading ? "..." : favorited ? "❤️ 已收藏" : "🤍 收藏"}
      </button>
      {error && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-500 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}
