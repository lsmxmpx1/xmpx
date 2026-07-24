import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyCode } from "@/lib/email-store";

export async function POST(req: NextRequest) {
  try {
    const { email, code, password } = await req.json();

    if (!email || !code || !password) {
      return NextResponse.json({ error: "邮箱、验证码和密码不能为空" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少6位" }, { status: 400 });
    }

    // 校验邮箱验证码
    const result = verifyCode(email, code);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // 校验用户存在
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "该邮箱未注册" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    return NextResponse.json({ success: true, message: "密码已重置，请使用新密码登录" });
  } catch {
    return NextResponse.json({ error: "重置失败，请稍后重试" }, { status: 500 });
  }
}
