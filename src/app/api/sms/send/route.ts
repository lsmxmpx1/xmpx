import { NextResponse } from "next/server";
import { generateCode, saveCode, canSend } from "@/lib/sms-store";
import { getSmsConfig, sendSms } from "@/lib/sms";

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

    // 通过已配置的短信网关发送
    const cfg = await getSmsConfig();
    const result = await sendSms(phone, code);
    if (!result.success) {
      // 即便网关返回失败（如配置错误），仍记录日志，登录流程由验证码本地校验兜底
      console.error(`[SMS] 发送失败: ${result.error}`);
    }

    return NextResponse.json({
      success: true,
      message: "验证码已发送",
      // 网关未启用时，开发环境返回验证码便于调试
      ...(process.env.NODE_ENV === "development" && !cfg.enabled ? { debugCode: code } : {}),
    });
  } catch {
    return NextResponse.json({ error: "发送失败，请稍后重试" }, { status: 500 });
  }
}
