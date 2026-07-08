import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password } = await req.json();

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "密码至少6位" }, { status: 400 });
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

    return NextResponse.json({ success: true, userId: user.id });
  } catch {
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
