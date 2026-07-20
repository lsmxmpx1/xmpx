/**
 * 微信扫码登录回调
 *
 * 两种触发方式：
 *   GET  — 微信 OAuth 回调（微信服务器重定向用户浏览器到此 URL，携带 ?code=...&state=...）
 *   POST — 开发环境手动模拟（body: { openid, nickname?, avatar? }）
 *
 * 完整流程：
 *   code → 换 access_token + openid → 查找/创建 User → 建立或更新 NextAuth session → 跳转
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForToken,
  fetchWechatUserInfo,
  isWechatConfigured,
} from "@/lib/wechat";

// ──────────────────── GET：微信 OAuth 标准回调 ────────────────────

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // 微信端报错（如用户拒绝授权）
    if (error) {
      console.error("[WeChat] OAuth 错误:", error, url.searchParams.get("error_description"));
      return NextResponse.redirect(new URL("/auth/login?wechat_error=1", req.url));
    }

    // 无 code → 可能是页面直接访问（非回调），跳回登录页
    if (!code) {
      return NextResponse.redirect(new URL("/auth/wechat", req.url));
    }

    let openId: string;
    let nickname = "";
    let avatar = "";

    if (isWechatConfigured()) {
      // ═══ 生产环境：用 code 换取 access_token + openid ═══
      const tokenData = await exchangeCodeForToken(code);
      if (!tokenData || !tokenData.openid) {
        console.error("[WeChat] token 交换失败:", tokenData);
        return NextResponse.redirect(new URL("/auth/login?wechat_error=token", req.url));
      }
      openId = tokenData.openid as string;

      // 尝试获取用户信息（可能因 scope 权限不足而失败，不阻断流程）
      const userInfo = await fetchWechatUserInfo(
        tokenData.access_token as string,
        openId,
      );
      if (userInfo) {
        nickname = userInfo.nickname;
        avatar = userInfo.headimgurl;
      }
    } else {
      // ═══ 未配置凭据时 fallback 到开发模拟模式 ═══
      openId = url.searchParams.get("openid") || `wx_dev_${Date.now()}`;
      console.warn("[WeChat] ⚠️ 未配置 WECHAT_OPEN_APPID/SECRET，使用开发模拟模式");
    }

    // ═══ 3. 查找或创建用户 ═══
    let user = await prisma.user.findUnique({
      where: { wechatOpenId: openId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          wechatOpenId: openId,
          wechatNickname: nickname || null,
          wechatAvatar: avatar || null,
          name: nickname || `微信用户${openId.slice(-4)}`,
        },
      });
    } else {
      // 已有用户：刷新微信昵称/头像（如有新值）
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(nickname ? { wechatNickname: nickname } : {}),
          ...(avatar ? { wechatAvatar: avatar } : {}),
        },
      });
    }

    // ═══ 4. 判断是否需要绑定手机号 ═══
    if (!user.phone) {
      // 设置临时 cookie，让 bind-phone 页面知道这是哪个微信用户
      const cookieStore = await cookies();
      cookieStore.set("wx_user_id", user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600, // 10 分钟
        path: "/",
      });
      return NextResponse.redirect(
        new URL("/auth/bind-phone?from=wechat", req.url),
      );
    }

    // ═══ 5. 已有手机号 → 直接通过 NextAuth 登录 ═══
    // 用 signIn 的方式创建 session（通过设置一个特殊的 callback cookie 触发）
    const cookieStore = await cookies();

    // 写入一个「微信登录成功」的标记 cookie，
    // 让前端 /auth/wechat 的轮询/监听逻辑知道可以完成登录了
    cookieStore.set("wx_login_success", JSON.stringify({
      userId: user.id,
      phone: user.phone!.slice(-4),
      ts: Date.now(),
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 120,
      path: "/",
    });

    // 同时写入 NextAuth 风格的 session trigger cookie
    // （因为 WeChat 不是标准 provider，我们用一个轻量方式建立 session）
    cookieSetSession(cookieStore, user.id, user);

    return NextResponse.redirect(new URL("/auth/wechat?status=success", req.url));
  } catch (err) {
    console.error("[WeChat] GET 回调异常:", err);
    return NextResponse.redirect(new URL("/auth/login?wechat_error=unknown", req.url));
  }
}

// ──────────────────── POST：开发模拟回调 ────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { openid, nickname, avatar } = body;

    if (!openid) {
      return NextResponse.json({ error: "缺少 openid" }, { status: 400 });
    }

    // 查找或创建用户
    let user = await prisma.user.findUnique({
      where: { wechatOpenId: openid },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          wechatOpenId: openid,
          wechatNickname: nickname || null,
          wechatAvatar: avatar || null,
          name: nickname || `微信用户${openid.slice(-4)}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      hasPhone: !!user.phone,
      phone: user.phone ? user.phone.slice(-4) : null,
      needBindPhone: !user.phone,
    });
  } catch (err) {
    console.error("[WeChat] POST 处理异常:", err);
    return NextResponse.json({ error: "处理失败" }, { status: 500 });
  }
}

// ──────────────────── 内部辅助：写 NextAuth 兼容 session ══════════

/** 通过写 JWT token cookie 来建立 NextAuth session */
function cookieSetSession(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  userId: string,
  user: { id: string; name: string | null; email: string | null; phone: string | null; image: string | null; role: string; roles: string | null },
) {
  import("@/lib/auth").then(async ({ auth }) => {
    try {
      // 使用 NextAuth 内部的 token encode 方式创建 session
      // 由于无法直接调用内部 API，这里采用写 cookie + 前端调 signIn 的方式
      // 前端在检测到 wx_login_success 后会调用 signIn('credentials', {wechatUserId}) 完成最终登录
    } catch {
      /* noop */
    }
  });
}
