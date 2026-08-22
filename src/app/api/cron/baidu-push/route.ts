import { NextRequest, NextResponse } from "next/server";
import {
  pushToBaidu,
  getPendingPushUrls,
  logBaiduPush,
} from "@/lib/baidu-push";

// Vercel Cron 由 Serverless 直接调用，不受本地电脑关机影响。
// 该路由不使用 next-auth 会话鉴权，改用 CRON_SECRET 校验（Vercel 自动注入 Authorization 头）。
export const maxDuration = 60;

async function runPush() {
  console.log(
    `[VercelCron][BaiduPush] token来源: ${process.env.BAIDU_PUSH_TOKEN ? "环境变量" : "硬编码回退"}`,
  );
  // 推送所有尚未成功推送的公开 URL（不限时间窗），与后台待推送列表口径一致，
  // 这样每天 10 点会自动清空待推送，而不会因“当日无新增”而跳过历史遗留。
  const { pending: urls } = await getPendingPushUrls();
  console.log(`[VercelCron][BaiduPush] 待推送(未成功) ${urls.length} 条`);

  if (urls.length === 0) {
    await logBaiduPush({
      type: "cron",
      urls: [],
      count: 0,
      success: 0,
      remain: null,
      error: null, // 无待推送不算失败
      triggeredBy: "vercel-cron",
    });
    return {
      success: true,
      submitted: 0,
      successCount: 0,
      message: "暂无待推送内容",
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
