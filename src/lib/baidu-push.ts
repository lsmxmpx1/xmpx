/**
 * 百度搜索资源平台推送（主动推送 API）
 *
 * 文档：https://ziyuan.baidu.com/college/courseinfo?id=267
 *
 * 使用方式：
 *   - API 路由：POST /api/admin/baidu-push
 *   - 代码内调用：await pushToBaidu(["https://www.xmpx.cn/articles/123"])
 */

const BAIDU_API_URL =
  "http://data.zz.baidu.com/urls?site=www.xmpx.cn&token=PEIKdvyhZCyQrWI3";
const SITE_HOST = "https://www.xmpx.cn";

/** 单次推送最多 URL 数（百度限制） */
const BATCH_SIZE = 2000;

export interface BaiduPushResult {
  success: boolean;
  submitted: number;    // 本次提交数
  successCount: number; // 成功收录数
  remain?: number;      // 当日剩余配额
  error?: string;
}

/**
 * 向百度推送 URL 列表（主动推送，实时收录）
 *
 * @param urls 完整 URL 列表
 */
export async function pushToBaidu(urls: string[]): Promise<BaiduPushResult> {
  if (!urls || urls.length === 0) {
    return { success: true, submitted: 0, successCount: 0 };
  }

  const unique = Array.from(new Set(urls.filter(Boolean)));
  if (unique.length === 0) {
    return { success: true, submitted: 0, successCount: 0 };
  }

  try {
    const body = unique.join("\n");
    const res = await fetch(BAIDU_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "User-Agent": "curl/7.12.1",
      },
      body,
    });

    const text = await res.text().catch(() => "");

    if (!res.ok && !text) {
      return {
        success: false,
        submitted: unique.length,
        successCount: 0,
        error: `HTTP ${res.status}`,
      };
    }

    // 百度返回 JSON：{ success: N, remain: M } 或 { error: "..." }
    let json: Record<string, unknown>;
    try {
      json = JSON.parse(text);
    } catch {
      return {
        success: false,
        submitted: unique.length,
        successCount: 0,
        error: `非 JSON 响应: ${text.substring(0, 200)}`,
      };
    }

    if (json.error) {
      return {
        success: false,
        submitted: unique.length,
        successCount: 0,
        error: String(json.error),
      };
    }

    const successCount = typeof json.success === "number" ? json.success : 0;
    const remain = typeof json.remain === "number" ? json.remain : undefined;

    console.log(
      `[BaiduPush] 推送成功: ${successCount}/${unique.length} 条, 剩余配额: ${remain ?? "未知"}`
    );

    return {
      success: true,
      submitted: unique.length,
      successCount,
      remain,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[BaiduPush] 网络异常: ${msg}`);
    return {
      success: false,
      submitted: unique.length,
      successCount: 0,
      error: `网络请求失败: ${msg}`,
    };
  }
}

/**
 * 从数据库收集待推送的公开页面 URL
 *
 * 收集范围：
 * - 已发布文章 /articles/[id]
 * - 活跃课程 /courses/[id]
 * - 机构详情 /institutions/[id]
 * - 老师详情 /teachers/[id]
 * - 已审核问答 /questions/[id]
 */
export async function collectPublicUrls(
  since?: Date,
): Promise<string[]> {
  const { prisma } = await import("@/lib/prisma");
  const urls: string[] = [];

  // 文章（按发布时间）
  const articleWhere: Record<string, unknown> = { published: true };
  if (since) articleWhere.publishedAt = { gte: since };
  const articles = await prisma.article.findMany({
    where: articleWhere,
    select: { id: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: BATCH_SIZE,
  });
  for (const a of articles) urls.push(`${SITE_HOST}/articles/${a.id}`);

  // 课程（按创建时间）
  const courseWhere: Record<string, unknown> = { status: "ACTIVE" };
  if (since) courseWhere.createdAt = { gte: since };
  const courses = await prisma.course.findMany({
    where: courseWhere,
    select: { id: true },
    orderBy: { createdAt: "desc" },
    take: BATCH_SIZE,
  });
  for (const c of courses) urls.push(`${SITE_HOST}/courses/${c.id}`);

  // 机构（按创建时间）
  const instWhere: Record<string, unknown> = {};
  if (since) instWhere.createdAt = { gte: since };
  const institutions = await prisma.institution.findMany({
    where: instWhere,
    select: { id: true },
    orderBy: { createdAt: "desc" },
    take: BATCH_SIZE,
  });
  for (const i of institutions) urls.push(`${SITE_HOST}/institutions/${i.id}`);

  // 老师（按创建时间）
  const teacherWhere: Record<string, unknown> = {};
  if (since) teacherWhere.createdAt = { gte: since };
  const teachers = await prisma.teacher.findMany({
    where: teacherWhere,
    select: { id: true },
    orderBy: { createdAt: "desc" },
    take: BATCH_SIZE,
  });
  for (const t of teachers) urls.push(`${SITE_HOST}/teachers/${t.id}`);

  // 问答（按创建时间，非 updatedAt）
  const qWhere: Record<string, unknown> = { isPublic: true };
  if (since) qWhere.createdAt = { gte: since };
  const questions = await prisma.question.findMany({
    where: qWhere,
    select: { id: true },
    orderBy: { createdAt: "desc" },
    take: BATCH_SIZE,
  });
  for (const q of questions) urls.push(`${SITE_HOST}/questions/${q.id}`);

  return Array.from(new Set(urls));
}

/**
 * 记录推送日志到数据库
 */
export async function logBaiduPush(params: {
  type: string;
  urls: string[];
  count: number;
  success: number;
  remain?: number | null;
  error?: string | null;
  response?: string | null;
  triggeredBy?: string;
}): Promise<void> {
  const { prisma } = await import("@/lib/prisma");
  await prisma.baiduPushLog.create({
    data: {
      type: params.type,
      urls: params.urls.join("\n"),
      count: params.count,
      success: params.success,
      remain: params.remain,
      error: params.error,
      response: params.response,
      triggeredBy: params.triggeredBy || "manual",
    },
  });
}
