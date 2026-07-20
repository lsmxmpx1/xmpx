/**
 * 轮询微信登录状态
 *
 * GET /api/auth/wechat/poll-status?scene=xxx
 *   - 公众号扫码流程：通过 scene 读 SystemCache 中的扫码登录态
 *     → { success:true, userId }               已登录（已有手机号）
 *     → { success:true, needBindPhone:true }   需绑定手机号（服务端已写 wx_user_id cookie）
 *     → {}                                      尚未扫码 / 已过期
 *
 * GET /api/auth/wechat/poll-status  （不带 scene，兼容旧 cookie 流程）
 *   - 读取 wechat-callback 写入的 wx_login_success / wx_user_id cookie
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { cacheGet } from "@/lib/wechat";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const scene = url.searchParams.get("scene");

    // ── 公众号扫码流程（scene 关联） ──
    if (scene) {
      const raw = await cacheGet(`wxscan:${scene}`);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.status === "done") {
          if (data.needBindPhone) {
            // 写入 wx_user_id，供 /auth/bind-phone?from=wechat 使用（与 OAuth 流程一致）
            const cookieStore = await cookies();
            cookieStore.set("wx_user_id", data.userId, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 600,
              path: "/",
            });
            return NextResponse.json({ success: true, needBindPhone: true });
          }
          return NextResponse.json({ success: true, userId: data.userId, needBindPhone: false });
        }
      }
      return NextResponse.json({});
    }

    // ── 兼容旧 cookie 流程（公众号网页授权 OAuth 等） ──
    const cookieStore = await cookies();

    const successCookie = cookieStore.get("wx_login_success")?.value;
    if (successCookie) {
      const data = JSON.parse(successCookie);
      cookieStore.delete("wx_login_success");
      return NextResponse.json({
        success: true,
        userId: data.userId,
        phone: data.phone || null,
        needBindPhone: false,
      });
    }

    const wxUserId = cookieStore.get("wx_user_id")?.value;
    if (wxUserId) {
      return NextResponse.json({
        success: true,
        userId: wxUserId,
        phone: null,
        needBindPhone: true,
      });
    }

    return NextResponse.json({});
  } catch {
    return NextResponse.json({});
  }
}
