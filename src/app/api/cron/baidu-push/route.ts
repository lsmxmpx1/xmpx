import { NextRequest, NextResponse } from "next/server";
import {
  pushToBaidu,
  collectPublicUrls,
  logBaiduPush,
} from "@/lib/baidu-push";

// Vercel Cron 由 Serverless 直接调用，不受本地电脑关机影响。
// 该路由不使用 next-auth 会话鉴权，改用 CRON_SECRET 校验（Vercel 自动注入 Authorization 头）。
export const maxDuration = 60;

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function runPush() {
  const since = todayMidnight();
  const urls = await collectPublicUrls(since);
  console.log(`[VercelCron][BaiduPush] 收集到 ${urls.length} 条当日新增 URL`);

  if (urls.length === 0) {
    await logBaiduPush({
      type: "cron",
      urls: [],
      count: 0,
      success: 0,
      remain: null,
      error: "no new urls since midnight",
      triggeredBy: "vercel-cron",
    });
    return {
      success: true,
      submitted: 0,
      successCount: 0,
      message: "当日无新增内容，未推送",
    };
  }

  const result = await pushToBaidu(urls);
  await logBaiduPush({
    type: "cron",
    urls,
    count: result.submitted,
    success: result.successCount,
    remain: result.remain ?? null,
    error: result.error ?? null,
    triggeredBy: "vercel-cron",
  });
  return result;
}

// Vercel Cron 以 GET 请求触发本路由
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runPush();
    return NextResponse.json(result);
  } catch (e) {
    console.error("[VercelCron][BaiduPush] FATAL", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "推送失败" },
      { status: 500 },
    );
  }
}

// 方便本地手动测试：curl -X POST localhost:3000/api/cron/baidu-push
export async function POST(req: NextRequest) {
  return GET(req);
}
