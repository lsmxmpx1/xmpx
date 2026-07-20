/**
 * 微信公众号（订阅号/服务号）扫码登录工具函数
 *
 * 与「开放平台网站应用」的区别：
 *   - 开放平台用 open.weixin.qq.com/connect/qrconnect 的 PC 二维码（iframe）
 *   - 公众号没有 PC 扫码端点，改用「带参数二维码」：
 *       PC 端展示公众号二维码图片 → 用户用微信扫一扫（需关注公众号）
 *       → 公众号服务器收到 SCAN/subscribe 事件推送到 /api/wechat/event
 *       → 服务端查建用户并写入扫码登录态 → PC 轮询 poll-status 拿到结果 → 完成登录
 *   - 个人订阅号即可使用（无需企业认证），门槛更低
 *
 * 前置条件（环境变量）：
 *   WECHAT_MP_APPID     公众号 AppID
 *   WECHAT_MP_APPSECRET 公众号 AppSecret
 *   WECHAT_MP_TOKEN     公众号后台「服务器配置」里填的 Token（用于事件签名校验）
 *   WECHAT_MP_AES_KEY   可选，安全模式下的 EncodingAESKey（本文按明文/兼容模式处理）
 *   NEXTAUTH_URL        站点地址（用于拼接网页授权回调，如 https://www.xmpx.cn）
 */
import { createHash } from "node:crypto";
import { prisma } from "./prisma";

// ──────────────────── 配置读取 ────────────────────

export interface MpConfig {
  appId: string;
  appSecret: string;
  token: string;
  aesKey?: string;
}

export function getMpConfig(): MpConfig | null {
  const appId = process.env.WECHAT_MP_APPID;
  const appSecret = process.env.WECHAT_MP_APPSECRET;
  const token = process.env.WECHAT_MP_TOKEN;
  if (!appId || !appSecret || !token) return null;
  return {
    appId,
    appSecret,
    token,
    aesKey: process.env.WECHAT_MP_AES_KEY || undefined,
  };
}

/** 是否已配置好公众号凭据 */
export function isMpConfigured(): boolean {
  return getMpConfig() !== null;
}

const MP_API = "https://api.weixin.qq.com/cgi-bin";

// ──────────────────── 通用键值缓存（SystemCache 表） ────────────────────

export async function cacheSet(key: string, value: string, ttlSeconds: number) {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  await prisma.systemCache.upsert({
    where: { key },
    create: { key, value, expiresAt },
    update: { value, expiresAt },
  });
}

export async function cacheGet(key: string): Promise<string | null> {
  const row = await prisma.systemCache.findUnique({ where: { key } });
  if (!row) return null;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
    await prisma.systemCache.delete({ where: { key } }).catch(() => {});
    return null;
  }
  return row.value;
}

// ──────────────────── access_token（带缓存，避免触发限频） ────────────────────

export async function getMpAccessToken(): Promise<string> {
  const cfg = getMpConfig();
  if (!cfg) throw new Error("WECHAT_MP 未配置");

  const cached = await cacheGet("mp_access_token");
  if (cached) return cached;

  const url = `${MP_API}/token?grant_type=client_credential&appid=${cfg.appId}&secret=${cfg.appSecret}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.errcode) {
    throw new Error(`获取 access_token 失败: ${data.errcode} ${data.errmsg}`);
  }
  // 提前 5 分钟过期，避免临界点用到失效 token
  await cacheSet("mp_access_token", data.access_token, Math.max(60, data.expires_in - 300));
  return data.access_token;
}

// ──────────────────── 带参数二维码（PC 扫码登录） ────────────────────

export interface ScanQr {
  ticket: string;
  qrUrl: string; // 可直接用 <img src> 展示的二维码图片地址
  expireSeconds: number;
}

/** 生成带参数的临时二维码，scene 用于关联本次 PC 登录会话 */
export async function createScanQr(sceneStr: string): Promise<ScanQr> {
  const token = await getMpAccessToken();
  const res = await fetch(`${MP_API}/qrcode/create?access_token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      expire_seconds: 300,
      action_name: "QR_STR_SCENE",
      action_info: { scene: { scene_str: sceneStr } },
    }),
  });
  const data = await res.json();
  if (data.errcode) {
    throw new Error(`生成二维码失败: ${data.errcode} ${data.errmsg}`);
  }
  return {
    ticket: data.ticket,
    qrUrl: `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(data.ticket)}`,
    expireSeconds: 300,
  };
}

// ──────────────────── 公众号网页授权（微信内浏览器 OAuth） ────────────────────

/** 拼接网页授权跳转地址（仅在微信内浏览器使用） */
export function buildMpOauthUrl(redirectUri: string, state: string, scope = "snsapi_userinfo"): string {
  const cfg = getMpConfig();
  if (!cfg) throw new Error("WECHAT_MP 未配置");
  const params = new URLSearchParams({
    appid: cfg.appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    state,
  });
  return `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
}

/** code 换网页授权 access_token + openid */
export async function exchangeMpOauthToken(code: string): Promise<Record<string, unknown> | null> {
  const cfg = getMpConfig();
  if (!cfg) return null;
  const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${cfg.appId}&secret=${cfg.appSecret}&code=${code}&grant_type=authorization_code`;
  const res = await fetch(url);
  const data = await res.json();
  if ("errcode" in data && data.errcode !== 0) {
    console.error("[WeChat] 网页授权获取 token 失败:", data);
    return null;
  }
  return data;
}

/** 网页授权 scope=snsapi_userinfo 时拉取用户昵称/头像 */
export async function getMpOauthUserInfo(
  accessToken: string,
  openId: string,
): Promise<{ nickname: string; headimgurl: string; unionid?: string } | null> {
  try {
    const res = await fetch(
      `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openId}&lang=zh_CN`,
    );
    const data = await res.json();
    if ("errcode" in data && data.errcode !== 0) return null;
    return {
      nickname: data.nickname ?? "",
      headimgurl: data.headimgurl ?? "",
      unionid: data.unionid,
    };
  } catch {
    return null;
  }
}

/** 扫码场景：用 openid 拉取关注用户信息（cgi-bin/user/info，需 access_token） */
export async function getMpFollowerInfo(
  openid: string,
): Promise<{ nickname: string; headimgurl: string; unionid?: string } | null> {
  try {
    const token = await getMpAccessToken();
    const res = await fetch(`${MP_API}/user/info?access_token=${token}&openid=${openid}&lang=zh_CN`);
    const data = await res.json();
    if (data.errcode) return null;
    return {
      nickname: data.nickname ?? "",
      headimgurl: data.headimgurl ?? "",
      unionid: data.unionid,
    };
  } catch {
    return null;
  }
}

// ──────────────────── 用户查建（按 openid） ────────────────────

export async function upsertUserByOpenid(
  openid: string,
  info?: { nickname?: string; headimgurl?: string; unionid?: string },
) {
  let user = await prisma.user.findUnique({ where: { wechatOpenId: openid } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        wechatOpenId: openid,
        wechatNickname: info?.nickname || null,
        wechatAvatar: info?.headimgurl || null,
        wechatUnionId: info?.unionid || null,
        name: info?.nickname || `微信用户${openid.slice(-4)}`,
      },
    });
  } else if (info?.nickname || info?.headimgurl || info?.unionid) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(info.nickname ? { wechatNickname: info.nickname } : {}),
        ...(info.headimgurl ? { wechatAvatar: info.headimgurl } : {}),
        ...(info.unionid ? { wechatUnionId: info.unionid } : {}),
      },
    });
  }
  return user;
}

// ──────────────────── 事件签名校验 & XML 解析 ────────────────────

/** 公众号服务器配置回调的签名校验（明文/兼容模式） */
export function verifySignature(signature: string, timestamp: string, nonce: string, token: string): boolean {
  const arr = [token, timestamp, nonce].sort();
  const sha = createHash("sha1").update(arr.join("")).digest("hex");
  return sha === signature;
}

/** 从微信事件 XML 中提取某个标签的文本（兼容 CDATA） */
function tag(xml: string, name: string): string {
  const cdata = xml.match(new RegExp(`<${name}><!\\[CDATA\\[(.*?)\\]\\]></${name}>`));
  if (cdata) return cdata[1];
  const plain = xml.match(new RegExp(`<${name}>(.*?)</${name}>`));
  if (plain) return plain[1];
  return "";
}

export interface WechatEvent {
  toUserName: string;
  fromUserName: string; // 用户 openid
  createTime: string;
  msgType: string;
  event?: string;
  eventKey?: string;
  ticket?: string;
}

/** 解析微信推送的 XML 消息/事件 */
export function parseWechatXml(xml: string): WechatEvent {
  return {
    toUserName: tag(xml, "ToUserName"),
    fromUserName: tag(xml, "FromUserName"),
    createTime: tag(xml, "CreateTime"),
    msgType: tag(xml, "MsgType"),
    event: tag(xml, "Event") || undefined,
    eventKey: tag(xml, "EventKey") || undefined,
    ticket: tag(xml, "Ticket") || undefined,
  };
}
