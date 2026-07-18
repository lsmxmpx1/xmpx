import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { DISTRICTS } from "@/lib/utils";
import type { Metadata } from "next";

export const revalidate = 60; // ISR: 避免每次请求连远程 Turso 超时

export const metadata: Metadata = {
  title: "找老师 - 厦门培训名师库",
  description: "厦门优质培训老师展示平台，查看老师擅长课程、任职机构、历史履历与学员评价，找到适合你的好老师。",
};

const SORT_OPTIONS = [
  { key: "", label: "综合评分" },
  { key: "reviews", label: "评价最多" },
  { key: "new", label: "最新入驻" },
];

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: {
    district?: string;
    expertise?: string;
    institution?: string;
    sort?: string;
    page?: string;
    q?: string;
  };
}) {
  const page = parseInt(searchParams.page || "1");
  const pageSize = 12;

  const where: Prisma.TeacherWhereInput = { status: "ACTIVE" };
  if (searchParams.district) where.district = searchParams.district;
  if (searchParams.institution) where.currentInstitutionId = searchParams.institution;
  if (searchParams.expertise) where.expertise = { contains: searchParams.expertise };
  if (searchParams.q) {
    where.OR = [
      { name: { contains: searchParams.q } },
      { title: { contains: searchParams.q } },
      { bio: { contains: searchParams.q } },
      { expertise: { contains: searchParams.q } },
    ];
  }

  let orderBy: Prisma.TeacherOrderByWithRelationInput = { rating: "desc" };
  if (searchParams.sort === "reviews") orderBy = { reviewCount: "desc" };
  if (searchParams.sort === "new") orderBy = { createdAt: "desc" };

  const [teachers, total, institutions] = await Promise.all([
    prisma.teacher.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { currentInstitution: { select: { id: true, name: true } } },
    }),
    prisma.teacher.count({ where }),
    prisma.institution.findMany({
      where: { status: "APPROVED" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 30,
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  // 保留当前筛选参数构造链接
  const buildHref = (patch: Record<string, string>) =>
    `/teachers?${new URLSearchParams(
      Object.entries({ ...searchParams, ...patch })
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString()}`;

  return (
    <div className="container-main py-8">
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">首页</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">找老师</span>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border p-4 sticky top-24">
            <h3 className="font-bold mb-3">区域筛选</h3>
            <ul className="space-y-1 mb-6">
              <li>
                <Link
                  href={buildHref({ district: "", page: "" })}
                  className={`block px-3 py-2 rounded-lg text-sm ${!searchParams.district ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  全部区域
                </Link>
              </li>
              {DISTRICTS.map((d) => (
                <li key={d}>
                  <Link
                    href={buildHref({ district: d, page: "" })}
                    className={`block px-3 py-2 rounded-lg text-sm ${searchParams.district === d ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    {d}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="font-bold mb-3">排序方式</h3>
            <ul className="space-y-1 mb-6">
              {SORT_OPTIONS.map((s) => (
                <li key={s.key}>
                  <Link
                    href={buildHref({ sort: s.key, page: "" })}
                    className={`block px-3 py-2 rounded-lg text-sm ${searchParams.sort === s.key || (!searchParams.sort && s.key === "") ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>

            {institutions.length > 0 && (
              <>
                <h3 className="font-bold mb-3">所在机构</h3>
                <ul className="space-y-1 max-h-64 overflow-auto">
                  <li>
                    <Link
                      href={buildHref({ institution: "", page: "" })}
                      className={`block px-3 py-2 rounded-lg text-sm ${!searchParams.institution ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      全部机构
                    </Link>
                  </li>
                  {institutions.map((inst) => (
                    <li key={inst.id}>
                      <Link
                        href={buildHref({ institution: inst.id, page: "" })}
                        className={`block px-3 py-2 rounded-lg text-sm truncate ${searchParams.institution === inst.id ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                      >
                        {inst.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Search bar */}
          <form className="mb-6 flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={searchParams.q || ""}
              placeholder="搜索老师姓名、头衔、擅长课程..."
              className="input-field flex-1"
            />
            {searchParams.district && (
              <input type="hidden" name="district" value={searchParams.district} />
            )}
            {searchParams.institution && (
              <input type="hidden" name="institution" value={searchParams.institution} />
            )}
            {searchParams.sort && (
              <input type="hidden" name="sort" value={searchParams.sort} />
            )}
            <button type="submit" className="btn-primary px-8">搜索</button>
          </form>

          <div className="flex items-end justify-between mb-6 flex-wrap gap-2">
            <h1 className="text-2xl font-bold">
              {searchParams.q ? `搜索"${searchParams.q}"` : "培训名师"}
              <span className="text-gray-400 text-lg ml-2">({total})</span>
            </h1>
            <Link href="/dashboard/teacher" className="text-sm text-primary-600 hover:underline">
              我是老师，创建我的档案 →
            </Link>
          </div>

          {teachers.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">👨‍🏫</div>
              <p>暂无老师，换个条件试试</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {teachers.map((t) => (
                <Link key={t.id} href={`/teachers/${t.id}`} className="card p-5 group">
                  <div className="flex items-start gap-4">
                    {t.avatar ? (
                      <Image
                        src={t.avatar}
                        alt={t.name}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full object-cover border shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-2xl font-bold text-primary-600 shrink-0">
                        {t.name.slice(0, 1)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg group-hover:text-primary-600 transition-colors truncate">
                        {t.name}
                      </h3>
                      {t.title && (
                        <div className="text-sm text-gray-500 mt-0.5 truncate">{t.title}</div>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="text-orange-400">★</span> {t.rating.toFixed(1)}
                        </span>
                        <span>{t.reviewCount} 评价</span>
                        {t.district && <span>{t.district}</span>}
                      </div>
                    </div>
                  </div>

                  {t.currentInstitution && (
                    <div className="text-sm text-gray-500 mt-3 truncate">
                      🏫 {t.currentInstitution.name}
                    </div>
                  )}

                  {t.expertise && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {t.expertise
                        .split(/[,，]/)
                        .map((e) => e.trim())
                        .filter(Boolean)
                        .slice(0, 4)
                        .map((e, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded text-xs"
                          >
                            {e}
                          </span>
                        ))}
                    </div>
                  )}

                  {t.bio && (
                    <p className="text-sm text-gray-500 mt-3 line-clamp-2">{t.bio}</p>
                  )}
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center mt-10 gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <Link
                  key={i}
                  href={buildHref({ page: String(i + 1) })}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium ${page === i + 1 ? "bg-primary-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"}`}
                >
                  {i + 1}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
