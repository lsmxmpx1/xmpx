import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { DISTRICTS } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SORT_OPTIONS = [
  { key: "", label: "综合评分" },
  { key: "courses", label: "课程最多" },
  { key: "reviews", label: "评价最多" },
];

export default async function InstitutionsPage({
  searchParams,
}: {
  searchParams: { district?: string; sort?: string; page?: string; q?: string };
}) {
  const page = parseInt(searchParams.page || "1");
  const pageSize = 12;

  const where: Prisma.InstitutionWhereInput = { status: "APPROVED" };
  if (searchParams.district) where.district = searchParams.district;
  if (searchParams.q) {
    where.OR = [
      { name: { contains: searchParams.q } },
      { description: { contains: searchParams.q } },
      { address: { contains: searchParams.q } },
    ];
  }

  let orderBy: Prisma.InstitutionOrderByWithRelationInput = { rating: "desc" };
  if (searchParams.sort === "courses") orderBy = { courseCount: "desc" };
  if (searchParams.sort === "reviews") orderBy = { reviewCount: "desc" };

  const [institutions, total] = await Promise.all([
    prisma.institution.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.institution.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="container-main py-8">
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">首页</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">找机构</span>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border p-4 sticky top-24">
            <h3 className="font-bold mb-3">区域筛选</h3>
            <ul className="space-y-1 mb-6">
              <li>
                <Link
                  href="/institutions"
                  className={`block px-3 py-2 rounded-lg text-sm ${!searchParams.district ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  全部区域
                </Link>
              </li>
              {DISTRICTS.map((d) => (
                <li key={d}>
                  <Link
                    href={`/institutions?district=${d}`}
                    className={`block px-3 py-2 rounded-lg text-sm ${searchParams.district === d ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    {d}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="font-bold mb-3">排序方式</h3>
            <ul className="space-y-1">
              {SORT_OPTIONS.map((s) => (
                <li key={s.key}>
                  <Link
                    href={`/institutions?${new URLSearchParams(Object.entries({ ...searchParams, sort: s.key }).filter(([, v]) => v !== undefined).map(([k, v]) => [k, v ?? ""])).toString()}`}
                    className={`block px-3 py-2 rounded-lg text-sm ${searchParams.sort === s.key || (!searchParams.sort && s.key === "") ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
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
              placeholder="搜索机构名称、地址、描述..."
              className="input-field flex-1"
            />
            {searchParams.district && (
              <input type="hidden" name="district" value={searchParams.district} />
            )}
            {searchParams.sort && (
              <input type="hidden" name="sort" value={searchParams.sort} />
            )}
            <button type="submit" className="btn-primary px-8">搜索</button>
          </form>

          <h1 className="text-2xl font-bold mb-6">
            {searchParams.q ? `搜索"${searchParams.q}"` : "培训机构"}
            <span className="text-gray-400 text-lg ml-2">({total})</span>
          </h1>

          {institutions.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">🏢</div>
              <p>暂无机构，换个关键词试试</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {institutions.map((inst) => (
                <Link key={inst.id} href={`/institutions/${inst.id}`} className="card overflow-hidden group">
                  {inst.cover && (
                    <div className="h-28 overflow-hidden">
                      <img
                        src={inst.cover}
                        alt={inst.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {inst.logo ? (
                        <img
                          src={inst.logo}
                          alt={inst.name}
                          className="w-16 h-16 rounded-2xl object-cover border shrink-0"
                          
                        />
                      ) : (
                        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-primary-600 shrink-0">
                          {inst.name.slice(0, 2)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg group-hover:text-primary-600 transition-colors truncate">
                          {inst.name}
                        </h3>
                        <div className="text-sm text-gray-400 mt-0.5">{inst.district}</div>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <span className="text-orange-400">★</span> {inst.rating.toFixed(1)}
                          </span>
                          <span>{inst.reviewCount} 评价</span>
                          <span>{inst.courseCount} 课程</span>
                        </div>
                        {inst.description && (
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{inst.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center mt-10 gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <Link
                  key={i}
                  href={`/institutions?${new URLSearchParams(Object.entries({ ...searchParams, page: String(i + 1) }).filter(([, v]) => v !== undefined).map(([k, v]) => [k, v ?? ""])).toString()}`}
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
