import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

// GET - list courses for the logged-in institution owner
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const inst = await prisma.institution.findUnique({ where: { ownerId: userId } });
  if (!inst) {
    return NextResponse.json({ error: "您还没有机构" }, { status: 404 });
  }

  const courses = await prisma.course.findMany({
    where: { institutionId: inst.id },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ courses });
}

// POST - create a new course
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const inst = await prisma.institution.findUnique({ where: { ownerId: userId } });
  if (!inst) {
    return NextResponse.json({ error: "您还没有机构，请先入驻" }, { status: 404 });
  }

  if (inst.status !== "APPROVED") {
    return NextResponse.json({ error: "机构审核通过后才能发布课程" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, categoryId, price, originalPrice, description, tags, cover } = body;

    if (!title || title.trim().length < 2) {
      return NextResponse.json({ error: "课程标题至少2个字符" }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: "请选择课程分类" }, { status: 400 });
    }

    // Validate category exists
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ error: "分类不存在" }, { status: 400 });
    }

    // Generate unique slug within this institution
    let slug = slugify(title);
    const existingSlug = await prisma.course.findFirst({
      where: { institutionId: inst.id, slug },
    });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const course = await prisma.course.create({
      data: {
        title: title.trim(),
        slug,
        description: description?.trim() || null,
        price: price?.trim() || null,
        originalPrice: originalPrice?.trim() || null,
        cover: cover?.trim() || null,
        tags: tags?.trim() || null,
        categoryId,
        institutionId: inst.id,
        status: "ACTIVE",
      },
    });

    // Update institution course count
    await prisma.institution.update({
      where: { id: inst.id },
      data: { courseCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, id: course.id });
  } catch (error) {
    console.error("Create course error:", error);
    return NextResponse.json({ error: "创建失败，请稍后再试" }, { status: 500 });
  }
}
