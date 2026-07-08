import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/reviews/[id] — edit own review
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await request.json();
  const { rating, content } = body;

  if (rating && (rating < 1 || rating > 5)) {
    return NextResponse.json({ error: "评分需在 1-5 之间" }, { status: 400 });
  }

  // Find review and verify ownership
  const review = await prisma.review.findUnique({ where: { id: params.id } });
  if (!review) return NextResponse.json({ error: "评价不存在" }, { status: 404 });
  if (review.userId !== userId) {
    return NextResponse.json({ error: "只能编辑自己的评价" }, { status: 403 });
  }

  const updated = await prisma.review.update({
    where: { id: params.id },
    data: {
      ...(rating ? { rating: Math.round(rating) } : {}),
      ...(content !== undefined ? { content: content || null } : {}),
    },
  });

  // Update aggregate
  if (review.institutionId) {
    const agg = await prisma.review.aggregate({
      where: { institutionId: review.institutionId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.institution.update({
      where: { id: review.institutionId },
      data: { rating: agg._avg.rating || 0, reviewCount: agg._count.rating },
    });
  }

  return NextResponse.json({ success: true, review: updated });
}

// DELETE /api/reviews/[id] — delete own review
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const review = await prisma.review.findUnique({ where: { id: params.id } });
  if (!review) return NextResponse.json({ error: "评价不存在" }, { status: 404 });
  if (review.userId !== userId) {
    return NextResponse.json({ error: "只能删除自己的评价" }, { status: 403 });
  }

  await prisma.review.delete({ where: { id: params.id } });

  // Update aggregate
  if (review.institutionId) {
    const agg = await prisma.review.aggregate({
      where: { institutionId: review.institutionId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.institution.update({
      where: { id: review.institutionId },
      data: { rating: agg._avg.rating || 0, reviewCount: agg._count.rating },
    });
  }

  return NextResponse.json({ success: true });
}
