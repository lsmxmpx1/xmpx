/**
 * 微信开放平台（网站应用）扫码登录工具函数
 *
 * 前置条件：
 *   - 在 https://open.weixin.qq.com 注册「网站应用」，拿到 APPID 和 APPSECRET
 *   - 在应用设置里配置「授权回调域」为你的域名（如 xmpx.cn）
 *   - 设置环境变量 WECHAT_OPEN_APPID / WECHAT_OPEN_APPSECRET / WECHAT_OPEN_REDIRECT_URI
 */

/** 微信 OAuth 用到的配置（运行时从环境变量读取，不硬编码） */
export function getWechatConfig() {
  const appId = process.env.WECHAT_OPEN_APPID || "";
  const appSecret = process.env.WECHAT_OPEN_APPSECRET || "";
  const redirectUri =
    process.env.WECHAT_OPEN_REDIRECT_URI ||
    `${process.env.NEXTAUTH_URL || ""}/api/auth/wechat/callback`;
  return { appId, appSecret, redirectUri };
}

/** 是否已配置好微信开放平台凭据 */
export function isWechatConfigured() {
  const c = getWechatConfig();
  return !!(c.appId && c.appSecret && c.redirectUri);
}

/**
 * 生成微信扫码登录的授权 URL（用于 iframe 或新窗口打开）
 *
 * @param state 防 CSRF 的随机字符串
 * @returns 完整的微信 OAuth 授权地址
 */
export function buildWechatQrUrl(state?: string) {
  const { appId, redirectUri } = getWechatConfig();
  if (!appId) throw new Error("WECHAT_OPEN_APPID 未配置");
  if (!redirectUri) throw new Error("WECHAT_OPEN_REDIRECT_URI 未配置");

  const params = new URLSearchParams({
    appid: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "snsapi_login",
    state: state || crypto.randomUUID(),
  });

  return `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`;
}

/**
 * 用 authorization_code 换取 access_token 和 openid
 *
 * @param code 微信回调携带的 code
 * @returns { access_token, expires_in, refresh_token, openid, scope } | null
 */
export async function exchangeCodeForToken(
  code: string,
): Promise<Record<string, unknown> | null> {
  const { appId, appSecret } = getWechatConfig();
  if (!appId || !appSecret) return null;

  const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`;

  const res = await fetch(url);
  const data = await res.json();

  if ("errcode" in data && data.errcode !== 0) {
    console.error("[WeChat] 获取 access_token 失败:", data);
    return null;
  }
  return data;
}

/**
 * 用 access_token 获取微信用户信息（昵称、头像等）
 *
 * 注意：snsapi_login 只能拿到 openid；要拿用户信息需要用 snsapi_userinfo scope，
 * 且用户必须关注了关联的公众号。大多数场景下只依赖 openid 即可。
 */
export async function fetchWechatUserInfo(
  accessToken: string,
  openId: string,
): Promise<{ nickname: string; headimgurl: string } | null> {
  try {
    const res = await fetch(
      `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openId}`,
    );
    const data = await res.json();

    if ("errcode" in data && data.errcode !== 0) {
      // 可能是没有 snsapi_userinfo 权限，不是致命错误
      console.warn("[WeChat] 获取用户信息失败(可能无权限):", data.errmsg);
      return null;
    }

    return {
      nickname: (data.nickname as string) || "",
      headimgurl: (data.headimgurl as string) || "",
    };
  } catch {
    return null;
  }
}
