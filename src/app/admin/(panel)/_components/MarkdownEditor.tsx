"use client";

import { useRef, useState } from "react";
import { renderMarkdown } from "@/lib/markdown";

type Props = {
  defaultValue?: string;
  name?: string;
};

/**
 * 轻量 Markdown 编辑器：
 * - 工具栏一键插入常用 Markdown 语法（加粗/斜体/标题/列表/引用/链接/代码）
 * - 编辑 / 预览 双模式切换（预览实时渲染）
 * - 通过隐藏 textarea 同步到表单字段（name），服务端 action 无需改动
 */
export default function MarkdownEditor({ defaultValue = "", name = "content" }: Props) {
  const [value, setValue] = useState(defaultValue || "");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const hiddenRef = useRef<HTMLTextAreaElement>(null);

  // 更新状态并同步到隐藏 textarea；可选恢复选区
  function sync(next: string, selStart?: number, selEnd?: number) {
    setValue(next);
    if (hiddenRef.current) hiddenRef.current.value = next;
    if (taRef.current && selStart != null) {
      requestAnimationFrame(() => {
        taRef.current?.focus();
        taRef.current?.setSelectionRange(selStart, selEnd ?? selStart);
      });
    }
  }

  // 用 before/after 包裹选中文本（无选中则插入占位符）
  function wrap(before: string, after: string = before, placeholder = "文本") {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const selected = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + before + selected + after + value.slice(e);
    sync(next, s + before.length, s + before.length + selected.length);
  }

  // 在当前行首插入前缀（标题/列表/引用）
  function linePrefix(prefix: string) {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    sync(next, s + prefix.length);
  }

  // 插入链接 [文本](url) 并将光标定位到 url 处
  function insertLink() {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const text = value.slice(s, e) || "链接文字";
    const snippet = `[${text}](https://)`;
    const next = value.slice(0, s) + snippet + value.slice(e);
    const urlStart = s + text.length + 3; // [ + text + ](
    sync(next, urlStart, urlStart + 8);
  }

  const btn =
    "px-2.5 py-1 text-xs rounded-md border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors";
  const btnActive = "bg-purple-600 text-white border-purple-600 hover:bg-purple-700";

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        <button type="button" className={btn + " font-bold"} onClick={() => wrap("**")} title="加粗">
          B
        </button>
        <button type="button" className={btn + " italic"} onClick={() => wrap("*")} title="斜体">
          I
        </button>
        <button type="button" className={btn + " font-semibold"} onClick={() => linePrefix("## ")} title="标题">
          H
        </button>
        <button type="button" className={btn} onClick={() => linePrefix("- ")} title="无序列表">
          • 列表
        </button>
        <button type="button" className={btn} onClick={() => linePrefix("> ")} title="引用">
          ❝ 引用
        </button>
        <button type="button" className={btn} onClick={insertLink} title="链接">
          🔗 链接
        </button>
        <button type="button" className={btn + " font-mono"} onClick={() => wrap("`")} title="行内代码">
          {"</>"} 代码
        </button>
        <div className="ml-auto flex gap-1.5">
          <button
            type="button"
            className={btn + (mode === "write" ? " " + btnActive : "")}
            onClick={() => setMode("write")}
          >
            编辑
          </button>
          <button
            type="button"
            className={btn + (mode === "preview" ? " " + btnActive : "")}
            onClick={() => setMode("preview")}
          >
            预览
          </button>
        </div>
      </div>

      {mode === "write" ? (
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => sync(e.target.value)}
          rows={14}
          placeholder="支持 Markdown 语法：# 标题、**加粗**、*斜体*、- 列表、> 引用、[链接](url)、```代码块``` 等"
          className="w-full px-4 py-3 font-mono text-sm focus:outline-none resize-y min-h-[300px]"
        />
      ) : (
        <div
          className="article-content px-4 py-3 min-h-[300px] bg-white"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
        />
      )}

      {/* 同步到表单字段，供服务端 action 读取 */}
      <textarea ref={hiddenRef} name={name} defaultValue={defaultValue} className="hidden" readOnly />
    </div>
  );
}
