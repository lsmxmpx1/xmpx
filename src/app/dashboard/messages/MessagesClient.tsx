"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sendMessage } from "./actions";

type ConvDisplay = {
  id: string;
  otherName: string;
  otherAvatar: string | null;
  otherRole: "TEACHER" | "INSTITUTION" | "STUDENT";
  otherHref: string | null;
  lastMessage: string | null;
  lastAt: string;
  unread: number;
};

const ROLE_TAG: Record<string, string> = {
  TEACHER: "老师",
  INSTITUTION: "机构",
  STUDENT: "学员",
};

function fmtTime(s: string) {
  const d = new Date(s);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

export default function MessagesClient({
  conversations,
  messages,
  selectedId,
}: {
  conversations: ConvDisplay[];
  messages: { id: string; content: string; senderRole: string; isMine: boolean; createdAt: string }[];
  currentUserId: string;
  selectedId: string | null;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const selected = conversations.find((c) => c.id === selectedId) || null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedId]);

  async function handleSend() {
    if (!selectedId || !text.trim() || sending) return;
    setSending(true);
    setError("");
    const res = await sendMessage(selectedId, text.trim());
    setSending(false);
    if ((res as any)?.error) {
      setError((res as any).error);
      return;
    }
    setText("");
    router.refresh();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!selected) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm p-10">
        {conversations.length === 0
          ? "从老师或机构主页点击「私信」即可开始对话"
          : "选择一个会话查看消息"}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* 头部 */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
        {selected.otherAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selected.otherAvatar}
            alt={selected.otherName}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
            {selected.otherName.slice(0, 1)}
          </div>
        )}
        <div>
          <div className="font-medium text-gray-800 flex items-center gap-2">
            {selected.otherHref ? (
              <Link href={selected.otherHref} className="hover:text-primary-600">
                {selected.otherName}
              </Link>
            ) : (
              selected.otherName
            )}
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              {ROLE_TAG[selected.otherRole]}
            </span>
          </div>
        </div>
      </div>

      {/* 消息流 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 max-h-[50vh] md:max-h-[52vh]">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-10">
            开始和{selected.otherName}的对话吧
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                  m.isMine
                    ? "bg-primary-600 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}
              >
                {m.content}
                <div
                  className={`text-[10px] mt-1 ${
                    m.isMine ? "text-white/70" : "text-gray-400"
                  }`}
                >
                  {fmtTime(m.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* 输入区 */}
      <div className="border-t border-gray-100 p-3">
        {error && <div className="text-xs text-red-500 mb-1">{error}</div>}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="输入消息，Enter 发送，Shift+Enter 换行"
            className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-400 max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="px-5 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-primary-700 shrink-0"
          >
            {sending ? "发送中" : "发送"}
          </button>
        </div>
      </div>
    </div>
  );
}
