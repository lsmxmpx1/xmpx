import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 重算老师聚合评分（仅统计公开评价）
async function updateTeacherAggregate(teacherId: string) {
  const agg = await prisma.teacherReview.aggregate({
    where: { teacherId, isPublic: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.teacher.update({
    where: { id: teacherId },
    data: { rating: agg._avg.rating || 0, reviewCount: agg._count.rating },
  });
}

// PUT /api/teacher-reviews/[id] — 编辑自己的评价
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const userId = session.user.id;
  const body = await request.json();
  const { rating, content } = body;

  if (rating && (rating < 1 || rating > 5)) {
    return NextResponse.json({ error: "评分需在 1-5 之间" }, { status: 400 });
  }

  const review = await prisma.teacherReview.findUnique({ where: { id: params.id } });
  if (!review) return NextResponse.json({ error: "评价不存在" }, { status: 404 });
  if (review.userId !== userId) {
    return NextResponse.json({ error: "只能编辑自己的评价" }, { status: 403 });
  }

  const updated = await prisma.teacherReview.update({
    where: { id: params.id },
    data: {
      ...(rating ? { rating: Math.round(rating) } : {}),
      ...(content !== undefined ? { content: content || null } : {}),
    },
  });

  await updateTeacherAggregate(review.teacherId);

  return NextResponse.json({ success: true, review: updated });
}

// DELETE /api/teacher-reviews/[id] — 删除自己的评价
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const userId = session.user.id;

  const review = await prisma.teacherReview.findUnique({ where: { id: params.id } });
  if (!review) return NextResponse.json({ error: "评价不存在" }, { status: 404 });
  if (review.userId !== userId) {
    return NextResponse.json({ error: "只能删除自己的评价" }, { status: 403 });
  }

  await prisma.teacherReview.delete({ where: { id: params.id } });
  await updateTeacherAggregate(review.teacherId);

  return NextResponse.json({ success: true });
}
