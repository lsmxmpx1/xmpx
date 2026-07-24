import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getNotifications, getUnreadCount, markRead, markAllRead } from "@/lib/notify";

// GET /api/notifications — 获取通知列表 + 未读数
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const url = new URL(request.url);
  // 仅查未读数（轻量，供 Header 铃铛轮询）
  if (url.searchParams.get("unread") === "1") {
    const count = await getUnreadCount(session.user.id);
    return NextResponse.json({ unread: count });
  }

  const take = Math.min(parseInt(url.searchParams.get("take") || "20", 10), 50);
  const skip = parseInt(url.searchParams.get("skip") || "0", 10);
  const result = await getNotifications(session.user.id, { take, skip });

  return NextResponse.json(result);
}

// PATCH /api/notifications — 标记已读
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  // 标记全部已读
  if (body.action === "markAllRead") {
    const count = await markAllRead(session.user.id);
    return NextResponse.json({ ok: true, marked: count });
  }

  // 标记单条已读
  if (body.id) {
    const ok = await markRead(body.id, session.user.id);
    return NextResponse.json({ ok });
  }

  return NextResponse.json({ error: "缺少参数 id 或 action" }, { status: 400 });
}
