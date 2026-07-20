/**
 * 返回微信扫码登录的授权 URL（供前端 iframe 嵌入）
 *
 * GET /api/auth/wechat/qr-url
 * → { url: "https://open.weixin.qq.com/connect/qrconnect?..." } 或 { url: null }
 *
 * 未配置 WECHAT_OPEN_APPID 时返回 { url: null }，前端降级到开发模拟模式
 */
import { NextResponse } from "next/server";
import { buildWechatQrUrl, isWechatConfigured } from "@/lib/wechat";

export async function GET() {
  if (!isWechatConfigured()) {
    return NextResponse.json({ url: null, reason: "未配置微信开放平台凭据" });
  }

  try {
    const state = crypto.randomUUID();
    const url = buildWechatQrUrl(state);
    return NextResponse.json({ url, state });
  } catch (err) {
    console.error("[WeChat QR-URL] 生成失败:", err);
    return NextResponse.json({ url: null, error: "生成失败" }, { status: 500 });
  }
}
