import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reviews?courseId=xxx or ?institutionId=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const institutionId = searchParams.get("institutionId");

  if (!courseId && !institutionId) {
    return NextResponse.json({ error: "需要提供 courseId 或 institutionId" }, { status: 400 });
  }

  const where: any = {};
  if (courseId) where.courseId = courseId;
  if (institutionId) where.institutionId = institutionId;

  const reviews = await prisma.review.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reviews });
}

// POST /api/reviews — create a review
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await request.json();
  const { rating, content, courseId, institutionId } = body;

  // Validation
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "评分需在 1-5 之间" }, { status: 400 });
  }
  if (!courseId && !institutionId) {
    return NextResponse.json({ error: "需要提供 courseId 或 institutionId" }, { status: 400 });
  }
  if (courseId && institutionId) {
    return NextResponse.json({ error: "不能同时评价课程和机构" }, { status: 400 });
  }

  // Check if user already reviewed this course/institution
  const existing = await prisma.review.findFirst({
    where: {
      userId,
      ...(courseId ? { courseId } : { institutionId }),
    },
  });

  if (existing) {
    return NextResponse.json({ error: "您已评价过，可以编辑已有评价" }, { status: 409 });
  }

  // Verify the course/institution exists
  if (courseId) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return NextResponse.json({ error: "课程不存在" }, { status: 404 });
  }
  if (institutionId) {
    const inst = await prisma.institution.findUnique({ where: { id: institutionId } });
    if (!inst) return NextResponse.json({ error: "机构不存在" }, { status: 404 });
  }

  // Create review
  const review = await prisma.review.create({
    data: {
      rating: Math.round(rating),
      content: content || null,
      userId,
      courseId: courseId || null,
      institutionId: institutionId || null,
    },
  });

  // Update aggregate rating
  await updateAggregateRating(courseId, institutionId);

  return NextResponse.json({ success: true, review });
}

// Helper: recalculate rating and reviewCount
async function updateAggregateRating(courseId?: string | null, institutionId?: string | null) {
  if (institutionId) {
    const agg = await prisma.review.aggregate({
      where: { institutionId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.institution.update({
      where: { id: institutionId },
      data: {
        rating: agg._avg.rating || 0,
        reviewCount: agg._count.rating,
      },
    });
  }
  // Note: Course model doesn't have rating/reviewCount fields,
  // so we only update institution. If needed, we can add fields to Course.
}
