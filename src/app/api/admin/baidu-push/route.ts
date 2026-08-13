import { NextRequest, NextResponse } from "next/server";
import {
  pushToBaidu,
  collectPublicUrls,
  logBaiduPush,
} from "@/lib/baidu-push";

/**
 * POST /api/admin/baidu-push
 *
 * 百度主动推送 API
 *
 * 请求体（可选）：
 *   - since: ISO datetime — 只推送此时间之后新增/更新的内容
 *   - urls: string[] — 手动指定要推送的 URL 列表（优先于自动收集）
 *   - triggeredBy: string — 触发来源标识（manual / cron）
 *
 * 响应：
 *   { success, submitted, successCount, remain, error }
 */
export async function POST(req: NextRequest) {
  try {
    // 鉴权：仅管理员可用
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const body = (await req.json().catch(() => {})) as Record<string, unknown>;
    let urls: string[];

    if (body.urls && Array.isArray(body.urls)) {
      urls = body.urls.filter(
        (u): u is string => typeof u === "string" && u.startsWith("http"),
      );
    } else {
      // 自动收集公开页面 URL
      const since = body.since ? new Date(body.since as string) : undefined;
      urls = await collectPublicUrls(since);
    }

    if (urls.length === 0) {
      return NextResponse.json({
        success: true,
        submitted: 0,
        successCount: 0,
        message: "没有需要推送的 URL",
      });
    }

    // 执行推送
    const result = await pushToBaidu(urls);

    // 记录日志
    await logBaiduPush({
      type: "api",
      urls,
      count: result.submitted,
      success: result.successCount,
      remain: result.remain ?? null,
      error: result.error ?? null,
      triggeredBy: (body.triggeredBy as string) || "manual",
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("[BaiduPush API]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "推送失败" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/admin/baidu-push
 *
 * 获取推送历史记录 + 待推送内容概览（已成功推送的自动排除）
 *
 * 查询参数（可选）：
 *   - logId: string — 查看某条日志的 URL 明细（用于点击「成功数」展开）
 */
export async function GET(req: NextRequest) {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const { prisma } = await import("@/lib/prisma");

    // 查询单条日志明细（点击成功数时用）
    const logId = req.nextUrl.searchParams.get("logId");
    if (logId) {
      const log = await prisma.baiduPushLog.findUnique({
        where: { id: logId },
      });
      if (!log) {
        return NextResponse.json({ error: "日志不存在" }, { status: 404 });
      }
      const urlList = (log.urls || "").split("\n").filter(Boolean);
      return NextResponse.json({
        id: log.id,
        type: log.type,
        count: log.count,
        success: log.success,
        remain: log.remain,
        error: log.error,
        triggeredBy: log.triggeredBy,
        createdAt: log.createdAt,
        urls: urlList,
      });
    }

    // 推送历史（最近 20 条，每条附带 URL 列表供前端展示）
    const logs = await prisma.baiduPushLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    // 为每条日志解析 URL 数组
    const logsWithUrls = logs.map((l) => ({
      ...l,
      urlList: (l.urls || "").split("\n").filter(Boolean),
    }));

    // 统计今日推送情况
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogs = await prisma.baiduPushLog.findMany({
      where: { createdAt: { gte: today } },
      orderBy: { createdAt: "desc" },
    });
    const todayTotal = todayLogs.reduce((sum, l) => sum + l.success, 0);

    // 收集所有已成功推送过的 URL（从 success > 0 且无 error 的日志中提取）
    const successfulLogs = await prisma.baiduPushLog.findMany({
      where: {
        AND: [
          { success: { gt: 0 } },
          { OR: [{ error: null }, { error: "" }] },
        ],
      },
      select: { urls: true },
    });
    const pushedUrlSet = new Set<string>();
    for (const sl of successfulLogs) {
      if (sl.urls) {
        for (const u of sl.urls.split("\n")) {
          const t = u.trim();
          if (t) pushedUrlSet.add(t);
        }
      }
    }

    // 待推送内容（最近 7 天内的新增/更新），排除已推送成功的
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const allPendingUrls = await (await import("@/lib/baidu-push")).collectPublicUrls(weekAgo);
    const unpushedUrls = allPendingUrls.filter((u) => !pushedUrlSet.has(u));

    return NextResponse.json({
      logs: logsWithUrls,
      stats: {
        todayPushed: todayTotal,
        todayRemain: todayLogs[0]?.remain ?? null,
        pendingCount: unpushedUrls.length,
        pushedCount: pushedUrlSet.size, // 已推送去重数
        pendingUrls: unpushedUrls.slice(0, 50), // 预览前 50 条（仅未推送的）
      },
    });
  } catch (e) {
    console.error("[BaiduPush GET]", e);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
