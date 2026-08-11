"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { createNotification, NotificationType } from "@/lib/notify";
import { getClientGeo, getClientGeoWithCity, type ClientGeo } from "@/lib/geo";
import { checkSensitiveContent, containsExternalLink } from "@/lib/moderation";

const VALID_TYPES = ["INSTITUTION", "COURSE", "OTHER"] as const;
type FeedbackType = (typeof VALID_TYPES)[number];

const PUZZLE_TOLERANCE = 8; // 拼图 X 坐标容差（px），与注册校验一致
const MAX_CONTENT_LEN = 200; // 留言内容最大长度（需求：200 字以内）
const MAX_NAME_LEN = 20; // 昵称 / 关联名称最大长度
const MAX_REPLY_LEN = 200; // 回复最大长度

// ── 防机器人：进程内限流（serverless 多实例不共享；生产建议改用 Redis/Upstash） ──
const RATE_LIMIT = 5; // 同一身份/IP 在窗口内最大提交数
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 分钟
const rateStore = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const arr = rateStore.get(key) ?? [];
  const recent = arr.filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  if (rateStore.size > 5000) {
    for (const k of Array.from(rateStore.keys())) {
      const v = rateStore.get(k)!;
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) rateStore.delete(k);
    }
  }
  rateStore.set(key, recent);
  return recent.length > RATE_LIMIT;
}

function clearPuzzleCookie() {
  cookies().delete("puzzle_x");
}

/** 去除控制字符/空字节，并剥离 HTML 标签与脚本，降低注入与存储型 XSS 风险。
 *  注：Prisma 使用参数化查询，天然防 SQL 注入；此处为纵深防御。 */
function sanitizeText(s: string): string {
  return s
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/<\s*(script|iframe|object|embed|style|link|meta)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|iframe|object|embed|style|link|meta)\b[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(javascript|vbscript|data)\s*:/gi, "$1")
    .trim();
}

/** 读取客户端真实 IP（用于限流 / 溯源标识） */
function getClientIp(): string {
  const h = headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "local";
  return h.get("x-real-ip")?.trim() || "local";
}

export async function submitFeedback(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  // ─── 1. 身份判定（决定是否强制拼图校验） ───
  const session = await auth();
  const isGuest = !session?.user?.id;

  // 游客必须完成拼图滑块校验；注册用户已登录，免校验
  if (isGuest) {
    const cookieX = cookies().get("puzzle_x")?.value;
    const puzzleXRaw = formData.get("puzzleX");
    if (cookieX === undefined || puzzleXRaw === null || puzzleXRaw === undefined || puzzleXRaw === "") {
      return { error: "请先完成拼图验证" };
    }
    const correctX = Number(cookieX);
    const submittedX = Number(puzzleXRaw);
    if (!Number.isFinite(correctX) || !Number.isFinite(submittedX) || Math.abs(correctX - submittedX) > PUZZLE_TOLERANCE) {
      clearPuzzleCookie();
      return { error: "验证失败，请重新拖动滑块完成拼图" };
    }
    clearPuzzleCookie();
  }

  // ─── 2. 蜜罐陷阱（机器人常自动填充隐藏字段） ───
  if (String(formData.get("website") || "").trim()) {
    return { error: "提交失败，请重试" };
  }

  // ─── 3. 限流（防机器人批量刷屏） ───
  const limiterKey = session?.user?.id ?? getClientIp();
  if (isRateLimited(limiterKey)) {
    return { error: "提交过于频繁，请稍后再试" };
  }

  // ─── 4. 内容清洗与长度校验 ───
  const content = sanitizeText(String(formData.get("content") || ""));
  if (!content) return { error: "请填写反馈内容" };
  if (content.length > MAX_CONTENT_LEN) return { error: `反馈内容过长（最多 ${MAX_CONTENT_LEN} 字）` };

  const rawType = String(formData.get("type") || "OTHER");
  const type: FeedbackType = (VALID_TYPES as readonly string[]).includes(rawType) ? (rawType as FeedbackType) : "OTHER";
  const targetName = sanitizeText(String(formData.get("targetName") || "")).slice(0, MAX_NAME_LEN) || null;

  // ─── 5. 安全校验：外链 + 敏感内容（依中国法规） ───
  if (containsExternalLink(content)) return { error: "留言不能包含外部链接" };
  const contentCheck = checkSensitiveContent(content);
  if (contentCheck.blocked) return { error: "留言包含违规内容，无法提交" };

  // ─── 6. 身份与地理信息 ───
  let authorName: string | null = null;
  let isGuestFlag = false;
  let geo: ClientGeo | null = null;

  if (session?.user?.id) {
    authorName = session.user.name || (session.user.phone ? `用户${session.user.phone.slice(-4)}` : "注册用户");
  } else {
    isGuestFlag = true;
    const nick = sanitizeText(String(formData.get("nickname") || "")).slice(0, MAX_NAME_LEN);
    if (nick && (containsExternalLink(nick) || checkSensitiveContent(nick).blocked)) {
      return { error: "昵称包含违规内容，无法提交" };
    }
    authorName = nick || "游客";
    geo = await getClientGeoWithCity(); // 含 IP API 兜底城市查询（Vercel 头无城市时自动补查）
  }

  await prisma.feedback.create({
    data: {
      userId: session?.user?.id ?? null,
      authorName,
      type,
      targetName,
      content,
      status: "PENDING",
      isPublic: false, // 默认隐藏，待后台审核并显式设为公开后才在前台展示
      isGuest: isGuestFlag,
      ipAddress: geo?.ipAddress ?? null,
      ipCountry: geo?.ipCountry ?? null,
      ipCity: geo?.ipCity ?? null,
    },
  });

  revalidatePath("/feedback");
  return { ok: true };
}

/* ----------------------- 留言回复 ----------------------- */

export async function submitFeedbackReply(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录后再回复" };

  const feedbackId = String(formData.get("feedbackId") || "").trim();
  const content = sanitizeText(String(formData.get("content") || ""));

  if (!feedbackId) return { error: "参数错误" };
  if (!content) return { error: "请填写回复内容" };
  if (content.length > MAX_REPLY_LEN) return { error: `回复内容过长（最多 ${MAX_REPLY_LEN} 字）` };
  if (containsExternalLink(content)) return { error: "回复不能包含外部链接" };
  if (checkSensitiveContent(content).blocked) return { error: "回复包含违规内容，无法提交" };

  const feedback = await prisma.feedback.findUnique({ where: { id: feedbackId }, select: { isPublic: true } });
  if (!feedback) return { error: "目标留言不存在" };
  if (!feedback.isPublic) return { error: "无法回复已隐藏的留言" };

  await prisma.feedbackReply.create({
    data: { feedbackId, userId: session.user.id, content },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  try {
    const original = await prisma.feedback.findUnique({ where: { id: feedbackId }, select: { userId: true } });
    if (original?.userId && original.userId !== session.user.id) {
      createNotification({
        recipientId: original.userId,
        type: NotificationType.FEEDBACK_REPLY,
        title: "有人回复了您的留言",
        body: content.length > 80 ? content.slice(0, 80) + "..." : content,
        relatedType: "Feedback",
        relatedId: feedbackId,
      }).catch(() => {});
    }
  } catch {}

  revalidatePath("/feedback");
  revalidatePath("/admin/feedback");
  return { ok: true };
}
