/**
 * 轮询微信扫码登录状态
 *
 * GET /api/auth/wechat/poll-status
 * → { success, userId?, phone?, needBindPhone? } 或 {}
 *
 * 前端每 2 秒调用一次，检测微信回调是否已完成（通过 cookie 判断）
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();

    // 检查微信回调设置的「登录成功」标记
    const successCookie = cookieStore.get("wx_login_success")?.value;
    if (successCookie) {
      const data = JSON.parse(successCookie);
      // 清除标记，避免重复处理
      cookieStore.delete("wx_login_success");
      return NextResponse.json({
        success: true,
        userId: data.userId,
        phone: data.phone || null,
        needBindPhone: false,
      });
    }

    // 检查是否需要绑定手机号（微信回调设置了 wx_user_id 但无 phone）
    const wxUserId = cookieStore.get("wx_user_id")?.value;
    if (wxUserId) {
      // 有 wx_user_id 但没有 wx_login_success → 需要绑定手机号
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
