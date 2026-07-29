import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notifyIndexNow } from "@/lib/indexnow";

// PUT - update a course
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = session.user.id;
  const inst = await prisma.institution.findUnique({ where: { ownerId: userId } });
  if (!inst) {
    return NextResponse.json({ error: "您还没有机构" }, { status: 404 });
  }

  // Ensure the course belongs to this institution
  const course = await prisma.course.findUnique({ where: { id: params.id } });
  if (!course || course.institutionId !== inst.id) {
    return NextResponse.json({ error: "课程不存在或无权操作" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, categoryId, price, originalPrice, description, tags, cover, status } = body;

    if (!title || title.trim().length < 2) {
      return NextResponse.json({ error: "课程标题至少2个字符" }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: "请选择课程分类" }, { status: 400 });
    }

    await prisma.course.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        price: price?.trim() || null,
        originalPrice: originalPrice?.trim() || null,
        cover: cover?.trim() || null,
        tags: tags?.trim() || null,
        categoryId,
        status: status || course.status,
      },
    });

    // 失效后台课程管理页与公开课程列表的缓存，避免"必须点搜索才出最新课程"
    revalidatePath("/admin/courses");
    revalidatePath("/courses");

    // 通知搜索引擎更新收录（fire-and-forget）
    notifyIndexNow([`https://www.xmpx.cn/courses/${params.id}`]).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update course error:", error);
    return NextResponse.json({ error: "更新失败，请稍后再试" }, { status: 500 });
  }
}

// DELETE - delete a course
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = session.user.id;
  const inst = await prisma.institution.findUnique({ where: { ownerId: userId } });
  if (!inst) {
    return NextResponse.json({ error: "您还没有机构" }, { status: 404 });
  }

  const course = await prisma.course.findUnique({ where: { id: params.id } });
  if (!course || course.institutionId !== inst.id) {
    return NextResponse.json({ error: "课程不存在或无权操作" }, { status: 403 });
  }

  try {
    await prisma.course.delete({ where: { id: params.id } });

    // Update institution course count
    await prisma.institution.update({
      where: { id: inst.id },
      data: { courseCount: { decrement: 1 } },
    });

    // 失效后台课程管理页与公开课程列表的缓存，避免"必须点搜索才出最新课程"
    revalidatePath("/admin/courses");
    revalidatePath("/courses");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete course error:", error);
    return NextResponse.json({ error: "删除失败，请稍后再试" }, { status: 500 });
  }
}
