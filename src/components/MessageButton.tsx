"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { startConversation } from "@/app/dashboard/messages/actions";

export default function MessageButton({
  peerType,
  peerId,
  currentUserId,
  isOwner,
  className,
}: {
  peerType: "TEACHER" | "INSTITUTION";
  peerId: string;
  currentUserId?: string;
  isOwner: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (!currentUserId) {
    return (
      <Link href="/auth/login" className={className ?? "btn-primary px-8"}>
        登录后私信
      </Link>
    );
  }
  if (isOwner) return null;

  async function handleClick() {
    setLoading(true);
    setErr("");
    const res = await startConversation(peerType, peerId);
    setLoading(false);
    if (res.conversationId) {
      router.push(`/dashboard/messages?c=${res.conversationId}`);
    } else if (res.error) {
      setErr(res.error);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={className ?? "btn-primary px-8"}
      >
        {loading ? "处理中…" : "私信"}
      </button>
      {err && <span className="text-xs text-red-500 ml-2">{err}</span>}
    </>
  );
}
