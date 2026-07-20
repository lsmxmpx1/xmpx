/**
 * 生成公众号「带参数二维码」用于 PC 扫码登录
 *
 * GET /api/auth/wechat/qr-url
 * → { configured: true, qrUrl, scene }  二维码图片地址 + 本次会话 scene
 * → { configured: false, qrUrl: null, scene: null }  未配置凭据，前端降级开发模拟
 */
import { NextResponse } from "next/server";
import { isMpConfigured, createScanQr, cacheSet } from "@/lib/wechat";

export async function GET() {
  if (!isMpConfigured()) {
    return NextResponse.json({ configured: false, qrUrl: null, scene: null });
  }

  try {
    const scene = `wxscan_${crypto.randomUUID().replace(/-/g, "")}`;
    const { qrUrl, expireSeconds } = await createScanQr(scene);
    // 记录 pending 态，便于 poll 判断是否存在/过期
    await cacheSet(`wxscan:${scene}`, JSON.stringify({ status: "pending", ts: Date.now() }), expireSeconds);
    return NextResponse.json({ configured: true, qrUrl, scene });
  } catch (err) {
    console.error("[WeChat QR-URL] 生成失败:", err);
    return NextResponse.json({ configured: false, qrUrl: null, scene: null, error: "生成失败" });
  }
}
