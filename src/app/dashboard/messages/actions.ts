"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification, NotificationType } from "@/lib/notify";

const MAX_LEN = 2000;

type PeerType = "TEACHER" | "INSTITUTION";

/**
 * 学员发起（或复用）与某老师/机构的私信会话。
 * peerId 为 Teacher.id 或 Institution.id，内部解析为对应的 userId。
 */
export async function startConversation(peerType: PeerType, peerId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "未登录" };
  const me = session.user.id;

  if (peerType !== "TEACHER" && peerType !== "INSTITUTION") {
    return { error: "无效的会话对象类型" };
  }

  // 解析对方 userId
  let peerUserId: string | null = null;
  let peerEntityId: string | null = peerId;
  if (peerType === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({
      where: { id: peerId },
      select: { userId: true },
    });
    peerUserId = teacher?.userId ?? null;
  } else {
    const inst = await prisma.institution.findUnique({
      where: { id: peerId },
      select: { ownerId: true },
    });
    peerUserId = inst?.ownerId ?? null;
  }

  if (!peerUserId) return { error: "对方不存在或未开通账号" };
  if (peerUserId === me) return { error: "不能给自己发私信" };

  // 复用已有会话
  const existing = await prisma.conversation.findFirst({
    where: { studentId: me, peerType, peerUserId },
    select: { id: true },
  });
  if (existing) return { conversationId: existing.id };

  const conv = await prisma.conversation.create({
    data: {
      studentId: me,
      peerType,
      peerUserId,
      peerEntityId,
    },
    select: { id: true },
  });
  return { conversationId: conv.id };
}

/**
 * 发送一条消息。校验当前用户必须是会话参与者之一。
 */
export async function sendMessage(conversationId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "未登录" };
  const me = session.user.id;

  const text = (content || "").trim();
  if (!text) return { error: "消息内容不能为空" };
  if (text.length > MAX_LEN) return { error: `消息过长（最多 ${MAX_LEN} 字）` };

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, studentId: true, peerUserId: true, peerType: true },
  });
  if (!conv) return { error: "会话不存在" };
  if (conv.studentId !== me && conv.peerUserId !== me) {
    return { error: "无权在此会话中发言" };
  }

  const senderRole =
    conv.studentId === me
      ? "STUDENT"
      : conv.peerType === "TEACHER"
        ? "TEACHER"
        : "INSTITUTION";

  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderId: me,
        senderRole,
        content: text,
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessage: text, lastAt: new Date() },
    }),
  ]);

  // 通知对方
  const recipientId = conv.studentId === me ? conv.peerUserId : conv.studentId;
  if (recipientId) {
    const senderName = session.user.name || "用户";
    createNotification({
      recipientId,
      type: NotificationType.MESSAGE,
      title: `您收到一条来自 ${senderName} 的私信`,
      body: text.length > 80 ? text.slice(0, 80) + "..." : text,
      relatedType: "Conversation",
      relatedId: conversationId,
    }).catch(() => {});
  }

  revalidatePath("/dashboard/messages");
  return { ok: true };
}

/**
 * 将当前用户作为接收方的未读消息标记为已读。
 */
export async function markConversationRead(conversationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "未登录" };
  const me = session.user.id;

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { studentId: true, peerUserId: true },
  });
  if (!conv) return { error: "会话不存在" };
  if (conv.studentId !== me && conv.peerUserId !== me) {
    return { error: "无权访问此会话" };
  }

  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: me },
      readAt: null,
    },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard/messages");
  return { ok: true };
}
