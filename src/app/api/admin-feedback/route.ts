import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// POST: 更新留言处理状态/回复
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, status, adminReply, isPublic } = body;
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

    await prisma.feedback.update({
      where: { id },
      data: {
        status: status || "PENDING",
        adminReply: (adminReply || "").trim() || null,
        isPublic: !!isPublic,
      },
    });
    revalidatePath("/feedback");
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "未知错误";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE: 删除留言或回复（?id=xxx 删除留言，?replyId=xxx 删除回复）
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const replyId = searchParams.get("replyId");
  const id = searchParams.get("id");

  try {
    if (replyId) {
      // 删除单条回复
      await prisma.feedbackReply.delete({ where: { id: replyId } });
      return NextResponse.json({ ok: true });
    }
    if (id) {
      // 删除整条留言（级联删除回复）
      await prisma.feedback.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "未知错误";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
