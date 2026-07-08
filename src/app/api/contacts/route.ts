import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - list contacts/leads for the logged-in institution owner
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = session.user.id;
  const inst = await prisma.institution.findUnique({ where: { ownerId: userId } });
  if (!inst) {
    return NextResponse.json({ error: "您还没有机构" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  const where: { institutionId: string; courseId?: string } = { institutionId: inst.id };
  if (courseId) where.courseId = courseId;

  const contacts = await prisma.contact.findMany({
    where,
    include: {
      course: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ contacts });
}
