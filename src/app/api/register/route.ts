import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password, confirmPassword, captcha } = await req.json();

    // 校验图形验证码（防机器人恶意注册）
    const cookieCode = req.cookies.get("captcha")?.value;
    const inputCode = (captcha || "").trim().toUpperCase();
    if (!cookieCode || !inputCode || cookieCode.toUpperCase() !== inputCode) {
      const fail = NextResponse.json({ error: "验证码错误，请重新输入" }, { status: 400 });
      fail.cookies.set("captcha", "", { path: "/", maxAge: 0 }); // 消费后清除
      return fail;
    }

    if (!password || password.length < 6) {
      const fail = NextResponse.json({ error: "密码至少6位" }, { status: 400 });
      fail.cookies.set("captcha", "", { path: "/", maxAge: 0 });
      return fail;
    }

    if (password !== confirmPassword) {
      const fail = NextResponse.json({ error: "两次输入的密码不一致" }, { status: 400 });
      fail.cookies.set("captcha", "", { path: "/", maxAge: 0 });
      return fail;
    }

    if (!email && !phone) {
      return NextResponse.json({ error: "邮箱或手机号至少填一个" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          phone ? { phone } : {},
        ].filter((c) => Object.keys(c).length > 0),
      },
    });

    if (existing) {
      return NextResponse.json({ error: "该邮箱或手机号已注册" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email: email || null, phone: phone || null, password: hashed },
    });

    const ok = NextResponse.json({ success: true, userId: user.id });
    ok.cookies.set("captcha", "", { path: "/", maxAge: 0 }); // 注册成功后清除
    return ok;
  } catch {
    const fail = NextResponse.json({ error: "注册失败" }, { status: 500 });
    fail.cookies.set("captcha", "", { path: "/", maxAge: 0 });
    return fail;
  }
}
