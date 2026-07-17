"use client";

import { useEffect, useRef, useState } from "react";

/** 常用表情分组（轻量、无需第三方依赖，emoji 为普通 Unicode，直接入库） */
const CATEGORIES: Record<string, string[]> = {
  常用: ["👍", "👎", "❤️", "😂", "😊", "🎉", "🔥", "✨", "💯", "🙏", "🤝", "💡"],
  表情: [
    "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😎", "🤔", "😅",
    "😉", "🙃", "😢", "😭", "😡", "😱", "🥳", "😴", "😇", "🤯",
    "🤗", "😏", "🥺", "😬",
  ],
  手势: [
    "👍", "👎", "👌", "✌️", "🤙", "👏", "🙌", "🤝", "💪", "🫶",
    "👆", "🤞", "🤟", "✊", "👊", "🖐️",
  ],
  符号: [
    "❤️", "💔", "💖", "⭐", "🌟", "✅", "❌", "⚠️", "❓", "❗",
    "💰", "🚀", "📚", "🏫", "📞", "📝", "🌈", "💬", "⏰", "🔔",
  ],
};

export default function EmojiPicker({
  onSelect,
}: {
  onSelect: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState("常用");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-gray-500 hover:text-blue-600 text-sm px-2 py-1 rounded hover:bg-gray-100"
        title="插入表情"
      >
        😊 表情
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
          <div className="flex flex-wrap gap-1 mb-2">
            {Object.keys(CATEGORIES).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={`text-xs px-2 py-1 rounded ${
                  cat === c
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-1 max-h-44 overflow-y-auto">
            {CATEGORIES[cat].map((e, i) => (
              <button
                key={`${cat}-${i}`}
                type="button"
                onClick={() => onSelect(e)}
                className="text-lg leading-none hover:bg-gray-100 rounded p-1 flex items-center justify-center"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
