import { NextResponse } from "next/server";
import { generateCode, saveCode, canSend } from "@/lib/sms-store";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    // 验证手机号格式（中国大陆手机号 11 位，1 开头）
    if (!phone || !/^1\d{10}$/.test(phone)) {
      return NextResponse.json({ error: "请输入正确的手机号" }, { status: 400 });
    }

    // 检查发送频率
    const cooldown = canSend(phone);
    if (!cooldown.ok) {
      return NextResponse.json(
        { error: `发送过于频繁，请 ${cooldown.waitSeconds} 秒后再试` },
        { status: 429 }
      );
    }

    // 生成验证码
    const code = generateCode();

    // 保存验证码
    saveCode(phone, code);

    // 生产环境：调用真实 SMS 服务发送
    if (process.env.SMS_PROVIDER) {
      // TODO: 接入真实短信服务（阿里云短信/腾讯云短信等）
      // await sendRealSms(phone, code);
      console.log(`[SMS] 短信已发送到 ${phone}，验证码: ${code}`);
    } else {
      // 开发环境：打印验证码到控制台
      console.log(`[SMS DEV] 验证码已发送到 ${phone}: ${code}`);
    }

    return NextResponse.json({
      success: true,
      message: "验证码已发送",
      // 开发环境返回验证码便于调试（生产环境删除此字段）
      ...(process.env.NODE_ENV === "development" && !process.env.SMS_PROVIDER
        ? { debugCode: code }
        : {}),
    });
  } catch {
    return NextResponse.json({ error: "发送失败，请稍后重试" }, { status: 500 });
  }
}
