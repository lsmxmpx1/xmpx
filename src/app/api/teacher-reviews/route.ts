import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/teacher-reviews?teacherId=xxx — 仅返回公开评价
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get("teacherId");

  if (!teacherId) {
    return NextResponse.json({ error: "需要提供 teacherId" }, { status: 400 });
  }

  const reviews = await prisma.teacherReview.findMany({
    where: { teacherId, isPublic: true },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reviews });
}

// POST /api/teacher-reviews — 创建对老师的评价
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();
  const { rating, content, teacherId } = body;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "评分需在 1-5 之间" }, { status: 400 });
  }
  if (!teacherId) {
    return NextResponse.json({ error: "需要提供 teacherId" }, { status: 400 });
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { id: true, userId: true },
  });
  if (!teacher) return NextResponse.json({ error: "老师不存在" }, { status: 404 });

  // 不能给自己评价
  if (teacher.userId === userId) {
    return NextResponse.json({ error: "不能评价自己" }, { status: 400 });
  }

  // 已评价过则提示编辑
  const existing = await prisma.teacherReview.findFirst({
    where: { userId, teacherId },
  });
  if (existing) {
    return NextResponse.json({ error: "您已评价过，可以编辑已有评价" }, { status: 409 });
  }

  const review = await prisma.teacherReview.create({
    data: {
      rating: Math.round(rating),
      content: content || null,
      userId,
      teacherId,
    },
  });

  await updateTeacherAggregate(teacherId);

  return NextResponse.json({ success: true, review });
}

// Helper: 重算老师的 rating / reviewCount（仅统计公开评价）
async function updateTeacherAggregate(teacherId: string) {
  const agg = await prisma.teacherReview.aggregate({
    where: { teacherId, isPublic: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.teacher.update({
    where: { id: teacherId },
    data: {
      rating: agg._avg.rating || 0,
      reviewCount: agg._count.rating,
    },
  });
}
