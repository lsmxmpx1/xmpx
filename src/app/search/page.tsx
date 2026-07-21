import { Prisma } from "@/generated/prisma/client";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

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

export function generateMetadata({ searchParams }: { searchParams: { q?: string } }): Metadata {
  return {
    title: searchParams.q ? `搜索: ${searchParams.q}` : "搜索课程、机构和老师",
    description: `在厦门培训网搜索${searchParams.q ? `"${searchParams.q}"` : ""}相关课程、培训机构与老师`,
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

  if (query) {
    [courses, institutions, teachers] = await Promise.all([
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
            placeholder="搜索课程、机构、老师..."
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary py-3 px-8">搜索</button>
        </form>
      </div>

      {!query ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p>输入关键词搜索课程、机构和老师</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Courses */}
          <section>
            <h2 className="text-xl font-bold mb-4">
              相关课程
              <span className="text-gray-400 text-base ml-2">({courses.length})</span>
            </h2>
            {courses.length === 0 ? (
              <p className="text-gray-400">未找到相关课程</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {courses.map((course) => (
                  <Link key={course.id} href={`/courses/${course.id}`} className="card group">
                    <div className="h-36 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center text-3xl">📖</div>
                    <div className="p-4">
                      <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">{course.category?.name}</span>
                      <h3 className="font-semibold mt-2 text-sm group-hover:text-primary-600 line-clamp-2">{course.title}</h3>
                      <div className="text-xs text-gray-400 mt-1">{course.institution?.name}</div>
                      <div className="text-lg font-bold text-accent-600 mt-2">{formatPrice(course.price)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Institutions */}
          <section>
            <h2 className="text-xl font-bold mb-4">
              相关机构
              <span className="text-gray-400 text-base ml-2">({institutions.length})</span>
            </h2>
            {institutions.length === 0 ? (
              <p className="text-gray-400">未找到相关机构</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {institutions.map((inst) => (
                  <Link key={inst.id} href={`/institutions/${inst.id}`} className="card p-5 group">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center text-xl font-bold text-primary-600 shrink-0">{inst.name.slice(0, 2)}</div>
                      <div className="min-w-0">
                        <h3 className="font-bold group-hover:text-primary-600 truncate">{inst.name}</h3>
                        <div className="text-sm text-gray-400">{inst.district}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <span className="text-orange-400">★</span> {inst.rating.toFixed(1)}
                          <span>{inst.courseCount} 课程</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Teachers */}
          <section>
            <h2 className="text-xl font-bold mb-4">
              相关老师
              <span className="text-gray-400 text-base ml-2">({teachers.length})</span>
            </h2>
            {teachers.length === 0 ? (
              <p className="text-gray-400">未找到相关老师</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {teachers.map((t) => (
                  <Link key={t.id} href={`/teachers/${t.id}`} className="card p-5 group">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-xl font-bold text-primary-600 shrink-0 overflow-hidden">
                        {t.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                        ) : (
                          t.name.slice(0, 1)
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold group-hover:text-primary-600 truncate">{t.name}</h3>
                        <div className="text-sm text-gray-400 truncate">{t.title}</div>
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          {t.currentInstitution?.name || t.district || "独立老师"}
                        </div>
                      </div>
                    </div>
                    {t.expertise && (
                      <div className="text-xs text-gray-500 mt-3 line-clamp-2">擅长：{t.expertise}</div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
