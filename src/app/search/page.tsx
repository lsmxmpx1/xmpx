import { Prisma } from "@/generated/prisma/client";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import SearchResults from "@/components/search/SearchResults";

export const revalidate = 30; // 搜索页 ISR 30s（搜索参数变化多）

type CourseWithRelations = Prisma.CourseGetPayload<{
  include: { institution: true; category: true };
}>;

type InstitutionResult = {
  id: string;
  name: string;
  district?: string | null;
  rating: number;
  courseCount: number;
};

type TeacherResult = Prisma.TeacherGetPayload<{
  include: { currentInstitution: true };
}>;

type ArticleResult = {
  id: string;
  title: string;
  cover: string | null;
  category: string | null;
  summary: string | null;
  publishedAt: Date | null;
};

export function generateMetadata({ searchParams }: { searchParams: { q?: string } }): Metadata {
  return {
    title: searchParams.q ? `搜索: ${searchParams.q}` : "搜索课程、机构、老师和培训资讯",
    description: `在厦门培训网搜索${searchParams.q ? `"${searchParams.q}"` : ""}相关课程、培训机构、老师与培训资讯`,
    // 动态搜索结果页不收录，避免重复/低质页进入索引
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q || "";

  let courses: CourseWithRelations[] = [];
  let institutions: InstitutionResult[] = [];
  let teachers: TeacherResult[] = [];
  let articles: ArticleResult[] = [];

  if (query) {
    [courses, institutions, teachers, articles] = await Promise.all([
      prisma.course.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
          ],
        },
        include: { institution: true, category: true },
        take: 12,
      }),
      prisma.institution.findMany({
        where: {
          status: "APPROVED",
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
          ],
        },
        take: 12,
      }),
      prisma.teacher.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { name: { contains: query } },
            { title: { contains: query } },
            { bio: { contains: query } },
            { expertise: { contains: query } },
          ],
        },
        include: { currentInstitution: true },
        take: 12,
      }),
      prisma.article.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: query } },
            { summary: { contains: query } },
            { content: { contains: query } },
            { category: { contains: query } },
          ],
        },
        orderBy: { publishedAt: "desc" },
        take: 12,
      }),
    ]);
  }

  return (
    <div className="container-main py-8">
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">首页</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">搜索</span>
      </div>

      {/* Search bar */}
      <div className="mb-8">
        <form className="flex gap-2 max-w-xl">
          <input
            name="q"
            defaultValue={query}
            placeholder="搜索课程、机构、老师、培训资讯..."
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary py-3 px-8">搜索</button>
        </form>
      </div>

      {!query ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p>输入关键词搜索课程、机构、老师和培训资讯</p>
        </div>
      ) : (
        <SearchResults
          courses={courses}
          institutions={institutions}
          teachers={teachers}
          articles={articles}
        />
      )}
    </div>
  );
}
