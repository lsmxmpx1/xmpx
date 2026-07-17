"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const VALID_TYPES = ["INSTITUTION", "COURSE", "OTHER"] as const;
type FeedbackType = (typeof VALID_TYPES)[number];

/**
 * 提交留言板反馈。仅注册登录用户可提交（匿名仅可浏览）。
 * 返回 { error } 或 { ok }，由客户端表单组件处理提示。
 */
export async function submitFeedback(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "请先登录后再提交反馈" };
  }

  const rawType = String(formData.get("type") || "OTHER");
  const type: FeedbackType = (VALID_TYPES as readonly string[]).includes(rawType)
    ? (rawType as FeedbackType)
    : "OTHER";
  const targetName = String(formData.get("targetName") || "").trim() || null;
  const content = String(formData.get("content") || "").trim();

  if (!content) {
    return { error: "请填写反馈内容" };
  }
  if (content.length > 2000) {
    return { error: "反馈内容过长（最多 2000 字）" };
  }

  const displayName =
    session.user.name ||
    (session.user.phone ? `用户${session.user.phone.slice(-4)}` : "注册用户");

  await prisma.feedback.create({
    data: {
      userId: session.user.id,
      authorName: displayName,
      type,
      targetName,
      content,
      status: "PENDING",
      isPublic: true,
    },
  });

  revalidatePath("/feedback");
  return { ok: true };
}

/* ----------------------- 留言回复 ----------------------- */

export async function submitFeedbackReply(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "请先登录后再回复" };
  }

  const feedbackId = String(formData.get("feedbackId") || "").trim();
  const content = String(formData.get("content") || "").trim();

  if (!feedbackId) return { error: "参数错误" };
  if (!content) return { error: "请填写回复内容" };
  if (content.length > 1000) return { error: "回复内容过长（最多 1000 字）" };

  // 校验目标留言存在且公开
  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: { isPublic: true },
  });
  if (!feedback) return { error: "目标留言不存在" };
  if (!feedback.isPublic) return { error: "无法回复已隐藏的留言" };

  await prisma.feedbackReply.create({
    data: {
      feedbackId,
      userId: session.user.id,
      content,
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  revalidatePath("/feedback");
  revalidatePath("/admin/feedback");
  return { ok: true };
}
