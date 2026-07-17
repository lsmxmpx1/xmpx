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
