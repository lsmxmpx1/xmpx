/**
 * 公众号「服务器配置」回调地址（在公众号后台「基本配置 → 服务器配置」填写）
 *   URL:  https://www.xmpx.cn/api/wechat/event
 *   Token: 与 WECHAT_MP_TOKEN 环境变量一致
 *   消息加解密方式：明文模式 或 兼容模式（本文按明文/兼容处理）
 *
 * GET  — 微信首次配置时的签名校验，原样返回 echostr
 * POST — 接收消息与事件推送（SCAN / subscribe 带参数二维码事件）
 */
import { NextResponse } from "next/server";
import {
  getMpConfig,
  verifySignature,
  parseWechatXml,
  getMpFollowerInfo,
  upsertUserByOpenid,
  cacheSet,
} from "@/lib/wechat";

const SCENE_PREFIX = "wxscan_";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const signature = url.searchParams.get("signature");
  const timestamp = url.searchParams.get("timestamp");
  const nonce = url.searchParams.get("nonce");
  const echostr = url.searchParams.get("echostr");
  const cfg = getMpConfig();

  if (!cfg || !signature || !timestamp || !nonce || !echostr) {
    return new Response("missing params", { status: 400 });
  }
  if (!verifySignature(signature, timestamp, nonce, cfg.token)) {
    return new Response("invalid signature", { status: 401 });
  }
  return new Response(echostr);
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const signature = url.searchParams.get("signature");
  const timestamp = url.searchParams.get("timestamp");
  const nonce = url.searchParams.get("nonce");
  const cfg = getMpConfig();

  if (!cfg || !signature || !timestamp || !nonce) {
    return new Response("missing params", { status: 400 });
  }
  if (!verifySignature(signature, timestamp, nonce, cfg.token)) {
    return new Response("invalid signature", { status: 401 });
  }

  try {
    const xml = await req.text();
    const msg = parseWechatXml(xml);

    if (
      msg.msgType === "event" &&
      (msg.event === "SCAN" || msg.event === "subscribe") &&
      msg.eventKey &&
      msg.eventKey.startsWith(SCENE_PREFIX)
    ) {
      // subscribe 事件里 EventKey 形如 qrscene_<scene>，需去掉前缀
      const scene = msg.eventKey.startsWith("qrscene_")
        ? msg.eventKey.slice("qrscene_".length)
        : msg.eventKey;

      const openid = msg.fromUserName;
      const info = await getMpFollowerInfo(openid).catch(() => null);
      const user = await upsertUserByOpenid(openid, info || undefined);

      // 写入扫码登录态，供 PC 端 poll-status 轮询
      await cacheSet(
        `wxscan:${scene}`,
        JSON.stringify({
          status: "done",
          userId: user.id,
          needBindPhone: !user.phone,
          ts: Date.now(),
        }),
        300,
      );
    }
  } catch (err) {
    console.error("[WeChat Event] 处理异常:", err);
  }

  // 微信要求 5 秒内响应；空串即可（公众号不会解析业务返回）
  return new Response("success", { status: 200 });
}
