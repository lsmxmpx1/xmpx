import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/favorites — get current user's favorites
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = session.user.id;

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: {
      course: { include: { institution: true, category: true } },
      institution: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ favorites });
}

// POST /api/favorites — toggle favorite (add or remove)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();
  const { courseId, institutionId } = body;

  if (!courseId && !institutionId) {
    return NextResponse.json({ error: "需要提供 courseId 或 institutionId" }, { status: 400 });
  }

  // Try to find existing favorite
  const existing = await prisma.favorite.findFirst({
    where: {
      userId,
      ...(courseId ? { courseId } : { institutionId }),
    },
  });

  if (existing) {
    // Already favorited → remove
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true, favorited: false });
  }

  // Not favorited → add
  await prisma.favorite.create({
    data: {
      userId,
      courseId: courseId || null,
      institutionId: institutionId || null,
    },
  });

  return NextResponse.json({ success: true, favorited: true });
}
