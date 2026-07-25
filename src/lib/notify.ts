/**
 * 统一消息通知服务
 *
 * 在各业务触发点调用 createNotification() 写入通知，
 * 消息中心页面统一展示、标记已读。
 */
import { prisma } from "./prisma";

// 通知类型枚举（与 Prisma model 注释保持一致）
export const NotificationType = {
  MESSAGE: "MESSAGE",                       // 收到私信
  CONTACT: "CONTACT",                       // 收到咨询/报名
  FEEDBACK_REPLY: "FEEDBACK_REPLY",         // 留言被回复
  REVIEW: "REVIEW",                         // 收到评价（课程/机构）
  QUESTION_APPROVED: "QUESTION_APPROVED",   // 提问审核通过
  ANSWER_APPROVED: "ANSWER_APPROVED",       // 回复被审核通过（通知提问者）
  ADMIN_REPLY_QUESTION: "ADMIN_REPLY_QUESTION", // 管理员回复了提问
  INSTITUTION_APPLIED: "INSTITUTION_APPLIED", // 新机构入驻申请
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

/** 创建一条通知（静默失败：recipientId 无效时不抛错） */
export async function createNotification(params: {
  recipientId: string;
  type: NotificationType | string;
  title: string;
  body?: string;
  relatedType?: string;
  relatedId?: string;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        recipientId: params.recipientId,
        type: params.type,
        title: params.title,
        body: params.body ?? null,
        relatedType: params.relatedType ?? null,
        relatedId: params.relatedId ?? null,
      },
    });
  } catch (e: unknown) {
    // recipientId 不存在等场景静默忽略，避免阻塞主流程
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[notify] 创建通知失败:", msg);
  }
}

/** 获取用户未读通知数 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { recipientId: userId, readAt: null },
  });
}

/** 获取用户通知列表（分页，最新在前） */
export async function getNotifications(userId: string, opts: { take?: number; skip?: number } = {}) {
  const { take = 20, skip = 0 } = opts;
  const [items, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.notification.count({ where: { recipientId: userId } }),
    prisma.notification.count({ where: { recipientId: userId, readAt: null } }),
  ]);
  return { items, total, unread };
}

/** 标记单条已读 */
export async function markRead(notificationId: string, userId: string): Promise<boolean> {
  const updated = await prisma.notification.updateMany({
    where: { id: notificationId, recipientId: userId, readAt: null },
    data: { readAt: new Date() },
  });
  return updated.count > 0;
}

/** 标记全部已读 */
export async function markAllRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { recipientId: userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count;
}
