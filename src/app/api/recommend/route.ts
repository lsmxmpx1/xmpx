import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [featuredInstitutions, hotCourses, stats] = await Promise.all([
      // Featured (recommended) institutions with their courses
      prisma.institution.findMany({
        where: { featured: true, status: "APPROVED" },
        orderBy: { rating: "desc" },
        include: {
          courses: {
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
            take: 3,
            include: {
              category: { select: { name: true, slug: true } },
            },
          },
        },
      }),

      // Hot courses across all approved institutions
      prisma.course.findMany({
        where: {
          status: "ACTIVE",
          institution: { status: "APPROVED" },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          institution: {
            select: { id: true, name: true, logo: true, rating: true },
          },
          category: { select: { name: true, slug: true } },
        },
      }),

      // Platform stats
      (async () => {
        const [institutionCount, courseCount, articleCount] = await Promise.all([
          prisma.institution.count({ where: { status: "APPROVED" } }),
          prisma.course.count({ where: { status: "ACTIVE" } }),
          prisma.article.count({ where: { published: true } }),
        ]);
        return { institutionCount, courseCount, articleCount };
      })(),
    ]);

    return NextResponse.json({
      success: true,
      featuredInstitutions,
      hotCourses,
      stats,
    });
  } catch (error: unknown) {
    console.error("Recommend API error:", error);
    const message = error instanceof Error ? error.message : "获取推荐失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
