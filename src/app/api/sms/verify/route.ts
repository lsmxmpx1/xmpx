import { NextResponse } from "next/server";
import { verifyCode } from "@/lib/sms-store";

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json({ error: "手机号和验证码不能为空" }, { status: 400 });
    }

    const result = await verifyCode(phone, code);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "验证通过" });
  } catch {
    return NextResponse.json({ error: "验证失败，请稍后重试" }, { status: 500 });
  }
}
