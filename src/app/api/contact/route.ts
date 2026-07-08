import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, message, courseId, institutionId } = body;

    if (!phone) {
      return NextResponse.json({ error: "请填写手机号" }, { status: 400 });
    }

    const { prisma } = await import("@/lib/prisma");

    const contact = await prisma.contact.create({
      data: {
        name: name || null,
        phone,
        message: message || null,
        courseId: courseId || null,
        institutionId: institutionId || null,
      },
    });

    return NextResponse.json({ success: true, id: contact.id });
  } catch (error) {
    console.error("Contact error:", error);
    return NextResponse.json({ error: "提交失败，请稍后再试" }, { status: 500 });
  }
}
