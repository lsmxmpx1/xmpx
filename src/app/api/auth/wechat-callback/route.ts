import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * 微信扫码回调 API（开发环境模拟，生产环境接入真实微信 OAuth）
 *
 * 流程：
 * 1. 微信用户扫码授权后，微信服务器回调此接口，携带 code 参数
 * 2. 服务端用 code 换取 access_token，获取用户 openId 等信息
 * 3. 查找或创建用户，生成 token，设置 cookie
 * 4. 如果用户未绑定手机号，重定向到绑定手机号页面
 *
 * 开发模式：接受 POST 请求，body 包含 mockWechatOpenId 等模拟数据
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    // 生产环境：用 code 向微信服务器换取 access_token 和用户信息
    let wechatOpenId: string;
    let wechatNickname = "";
    let wechatAvatar = "";

    if (process.env.WECHAT_APP_ID && process.env.WECHAT_APP_SECRET && code) {
      // === 真实微信 OAuth 流程 ===
      // 1. 用 code 换 access_token
      const tokenRes = await fetch(
        `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${process.env.WECHAT_APP_ID}&secret=${process.env.WECHAT_APP_SECRET}&code=${code}&grant_type=authorization_code`
      );
      const tokenData = await tokenRes.json();

      if (tokenData.errcode) {
        console.error("[WeChat] 获取 access_token 失败:", tokenData);
        return NextResponse.redirect(new URL("/auth/wechat?error=token_failed", req.url));
      }

      // 2. 用 access_token 获取用户信息
      const userRes = await fetch(
        `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}`
      );
      const userData = await userRes.json();

      wechatOpenId = userData.openid;
      wechatNickname = userData.nickname || "";
      wechatAvatar = userData.headimgurl || "";
    } else {
      // === 开发环境模拟流程 ===
      // 从 URL 参数中获取模拟数据
      wechatOpenId = code || url.searchParams.get("openid") || `wx_dev_${Date.now()}`;
    }

    // 3. 查找或创建用户
    let user = await prisma.user.findUnique({
      where: { wechatOpenId },
    });

    if (!user) {
      // 新微信用户：创建账号（暂未绑定手机号）
      user = await prisma.user.create({
        data: {
          wechatOpenId,
          wechatNickname: wechatNickname || undefined,
          wechatAvatar: wechatAvatar || undefined,
          name: wechatNickname || `微信用户${Date.now().toString(36).slice(-4)}`,
        },
      });
    } else {
      // 已有用户：更新微信信息
      await prisma.user.update({
        where: { id: user.id },
        data: {
          wechatNickname: wechatNickname || user.wechatNickname,
          wechatAvatar: wechatAvatar || user.wechatAvatar,
        },
      });
    }

    // 4. 设置 session cookie（使用简单的临时 token 方案）
    //    生产环境建议使用 NextAuth 的 signIn 机制
    const cookieStore = await cookies();

    // 存储用户 ID 到 cookie，后续在 bind-phone 页面使用
    cookieStore.set("wx_user_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 分钟有效期
      path: "/",
    });

    cookieStore.set("wx_auth_token", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    // 5. 判断是否需要绑定手机号
    if (!user.phone) {
      // 未绑定手机号，跳转到绑定页面
      return NextResponse.redirect(
        new URL(`/auth/bind-phone?uid=${user.id}`, req.url)
      );
    }

    // 已绑定手机号，直接用手机号+验证码登录
    // 发送自动验证码（简化流程）然后重定向到登录页
    const redirectUrl = new URL("/auth/wechat?status=need_login&phone=" + user.phone!.slice(-4), req.url);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("[WeChat] 回调处理异常:", error);
    return NextResponse.redirect(new URL("/auth/wechat?error=unknown", req.url));
  }
}

/**
 * POST 方式：用于开发环境手动模拟微信登录
 * body: { openid: string, nickname?: string, avatar?: string }
 */
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
          name: nickname || `微信用户${Date.now().toString(36).slice(-4)}`,
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
  } catch (error) {
    console.error("[WeChat POST] 处理异常:", error);
    return NextResponse.json({ error: "处理失败" }, { status: 500 });
  }
}
