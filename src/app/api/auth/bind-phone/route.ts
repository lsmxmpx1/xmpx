import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyCode } from "@/lib/sms-store";

/**
 * 微信登录后绑定手机号
 * POST body: { phone: string, code: string }
 * Cookie: wx_user_id (微信回调时设置)
 */
export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json({ error: "手机号和验证码不能为空" }, { status: 400 });
    }

    if (!/^1\d{10}$/.test(phone)) {
      return NextResponse.json({ error: "请输入正确的手机号" }, { status: 400 });
    }

    // 校验短信验证码
    const result = verifyCode(phone, code);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "验证码错误" }, { status: 400 });
    }

    // 检查手机号是否已被其他账号占用
    const existingPhoneUser = await prisma.user.findUnique({
      where: { phone },
    });

    // 从 cookie 获取微信用户 ID
    const cookieStore = await cookies();
    const wxUserId = cookieStore.get("wx_user_id")?.value;

    if (!wxUserId) {
      return NextResponse.json({ error: "微信授权已过期，请重新扫码" }, { status: 401 });
    }

    const wxUser = await prisma.user.findUnique({ where: { id: wxUserId } });
    if (!wxUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    if (existingPhoneUser && existingPhoneUser.id !== wxUserId) {
      // 该手机号已被另一个账号使用
      // 策略：合并账号，将微信 openId 转移到已有手机号账号
      if (!existingPhoneUser.wechatOpenId) {
        await prisma.user.update({
          where: { id: existingPhoneUser.id },
          data: {
            wechatOpenId: wxUser.wechatOpenId,
            wechatNickname: wxUser.wechatNickname || existingPhoneUser.wechatNickname,
            wechatAvatar: wxUser.wechatAvatar || existingPhoneUser.wechatAvatar,
          },
        });
        // 删除微信临时账号
        await prisma.user.delete({ where: { id: wxUserId } });

        // 清除 cookie
        cookieStore.delete("wx_user_id");
        cookieStore.delete("wx_auth_token");

        return NextResponse.json({
          success: true,
          message: "手机号绑定成功",
          userId: existingPhoneUser.id,
        });
      }

      return NextResponse.json(
        { error: "该手机号已绑定其他微信账号" },
        { status: 409 }
      );
    }

    // 更新微信用户的手机号
    await prisma.user.update({
      where: { id: wxUserId },
      data: { phone },
    });

    // 清除临时 cookie
    cookieStore.delete("wx_user_id");
    cookieStore.delete("wx_auth_token");

    return NextResponse.json({
      success: true,
      message: "手机号绑定成功",
      userId: wxUserId,
    });
  } catch (error) {
    console.error("[BindPhone] 绑定异常:", error);
    return NextResponse.json({ error: "绑定失败，请稍后重试" }, { status: 500 });
  }
}
