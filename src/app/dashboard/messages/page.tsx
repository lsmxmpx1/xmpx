import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import RoleSwitcher from "../RoleSwitcher";
import MessagesClient from "./MessagesClient";

export const dynamic = "force-dynamic";

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

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { c?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) return redirect("/auth/login");
  const me = session.user.id;

  const convs = await prisma.conversation.findMany({
    where: { OR: [{ studentId: me }, { peerUserId: me }] },
    orderBy: { lastAt: "desc" },
    include: { student: { select: { id: true, name: true, image: true } } },
  });

  // 批量解析对方展示信息（老师用 teacher.name/avatar，机构用 institution.name/logo）
  const teacherIds = Array.from(
    new Set(
      convs
        .filter((c) => c.studentId === me && c.peerType === "TEACHER")
        .map((c) => c.peerEntityId)
        .filter(Boolean) as string[]
    )
  );
  const instIds = Array.from(
    new Set(
      convs
        .filter((c) => c.studentId === me && c.peerType === "INSTITUTION")
        .map((c) => c.peerEntityId)
        .filter(Boolean) as string[]
    )
  );
  const [teachers, insts] = await Promise.all([
    teacherIds.length
      ? prisma.teacher.findMany({
          where: { id: { in: teacherIds } },
          select: { id: true, name: true, avatar: true },
        })
      : Promise.resolve([]),
    instIds.length
      ? prisma.institution.findMany({
          where: { id: { in: instIds } },
          select: { id: true, name: true, logo: true },
        })
      : Promise.resolve([]),
  ]);
  const teacherMap = Object.fromEntries(teachers.map((t) => [t.id, t]));
  const instMap = Object.fromEntries(insts.map((i) => [i.id, i]));

  // 未读数（我是接收方且未读）
  const unreadGroups = await prisma.message.groupBy({
    by: ["conversationId"],
    where: {
      senderId: { not: me },
      readAt: null,
      conversationId: { in: convs.map((c) => c.id) },
    },
    _count: { _all: true },
  });
  const unreadMap = Object.fromEntries(
    unreadGroups.map((g) => [g.conversationId, g._count._all])
  );

  const conversations: ConvDisplay[] = convs.map((c) => {
    const iAmStudent = c.studentId === me;
    let otherName = "用户";
    let otherAvatar: string | null = null;
    let otherRole: ConvDisplay["otherRole"] = "STUDENT";
    let otherHref: string | null = null;

    if (iAmStudent) {
      otherRole = c.peerType as "TEACHER" | "INSTITUTION";
      if (c.peerType === "TEACHER") {
        const t = teacherMap[c.peerEntityId as string];
        otherName = t?.name ?? "老师";
        otherAvatar = t?.avatar ?? null;
        otherHref = `/teachers/${c.peerEntityId}`;
      } else {
        const i = instMap[c.peerEntityId as string];
        otherName = i?.name ?? "机构";
        otherAvatar = i?.logo ?? null;
        otherHref = `/institutions/${c.peerEntityId}`;
      }
    } else {
      otherRole = "STUDENT";
      otherName = c.student.name ?? "学员";
      otherAvatar = c.student.image ?? null;
    }

    return {
      id: c.id,
      otherName,
      otherAvatar,
      otherRole,
      otherHref,
      lastMessage: c.lastMessage,
      lastAt: c.lastAt.toISOString(),
      unread: unreadMap[c.id] ?? 0,
    };
  });

  // 选中会话的消息
  const selectedId = searchParams.c && convs.some((c) => c.id === searchParams.c)
    ? searchParams.c
    : null;

  let messages: {
    id: string;
    content: string;
    senderRole: string;
    isMine: boolean;
    createdAt: string;
  }[] = [];

  if (selectedId) {
    const raw = await prisma.message.findMany({
      where: { conversationId: selectedId },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, name: true } } },
    });
    messages = raw.map((m) => ({
      id: m.id,
      content: m.content,
      senderRole: m.senderRole,
      isMine: m.senderId === me,
      createdAt: m.createdAt.toISOString(),
    }));
    // 打开即标记已读（我是接收方）
    await prisma.message.updateMany({
      where: {
        conversationId: selectedId,
        senderId: { not: me },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <RoleSwitcher current="USER" />
      <h1 className="text-2xl font-bold mb-6">我的私信</h1>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col md:flex-row min-h-[60vh]">
        {/* 会话列表 */}
        <aside className="md:w-80 shrink-0 border-b md:border-b-0 md:border-r border-gray-100">
          <div className="p-3 text-sm text-gray-400 border-b">会话（{conversations.length}）</div>
          <div className="overflow-y-auto max-h-[70vh] md:max-h-[65vh]">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                还没有私信。
                <br />
                去
                <Link href="/teachers" className="text-primary-600 hover:underline">
                  找老师
                </Link>
                或
                <Link href="/institutions" className="text-primary-600 hover:underline">
                  找机构
                </Link>
                发起私信吧。
              </div>
            ) : (
              conversations.map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/messages?c=${c.id}`}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    selectedId === c.id ? "bg-primary-50" : ""
                  }`}
                >
                  {c.otherAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.otherAvatar}
                      alt={c.otherName}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold shrink-0">
                      {c.otherName.slice(0, 1)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-800 truncate">{c.otherName}</span>
                      {c.unread > 0 && (
                        <span className="text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 shrink-0">
                          {c.unread}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {c.lastMessage || "（暂无消息）"}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </aside>

        {/* 对话区 */}
        <MessagesClient
          conversations={conversations}
          messages={messages}
          currentUserId={me}
          selectedId={selectedId}
        />
      </div>
    </div>
  );
}
