import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 创建回复（需登录），进入人工审核队列（默认不公开）
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录后再回复" }, { status: 401 });
  }

  const q = await prisma.question.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!q) return NextResponse.json({ error: "问题不存在" }, { status: 404 });

  let body: { content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const content = String(body.content || "").trim();
  if (content.length < 2) {
    return NextResponse.json({ error: "回复内容至少 2 个字" }, { status: 400 });
  }

  await prisma.answer.create({
    data: {
      questionId: params.id,
      authorId: session.user.id,
      authorName: session.user.name || "匿名用户",
      content,
      status: "PENDING",
      isPublic: false,
    },
  });

  return NextResponse.json({ ok: true });
}
