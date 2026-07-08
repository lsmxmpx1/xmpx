import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string; page?: string };
}) {
  const page = parseInt(searchParams.page || "1");
  const pageSize = 12;

  // Fetch all categories with parent relations for sidebar
  const allCategories = await prisma.category.findMany({
    include: { parent: true },
    orderBy: { name: "asc" },
  });

  // Determine selected category - could be parent or child
  const selectedCat = searchParams.category
    ? allCategories.find((c) => c.slug === searchParams.category)
    : null;

  // Build where clause: if parent category selected, include all children
  const where: any = { status: "ACTIVE" };
  if (selectedCat) {
    if (selectedCat.parentId === null) {
      // Parent category - match this category or any of its children
      const childIds = allCategories
        .filter((c) => c.parentId === selectedCat.id)
        .map((c) => c.id);
      where.categoryId = { in: [selectedCat.id, ...childIds] };
    } else {
      // Subcategory
      where.category = { slug: searchParams.category };
    }
  }
  if (searchParams.q) {
    where.OR = [
      { title: { contains: searchParams.q } },
      { description: { contains: searchParams.q } },
    ];
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: { institution: true, category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.course.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  // Group categories for sidebar: parents with children
  const parentCategories = allCategories
    .filter((c) => c.parentId === null)
    .map((p) => ({
      ...p,
      children: allCategories.filter((c) => c.parentId === p.id),
    }));

  return (
    <div className="container-main py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">首页</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">全部课程</span>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border p-4 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
            <h3 className="font-bold mb-3">课程分类</h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/courses"
                  className={`block px-3 py-2 rounded-lg text-sm ${!searchParams.category ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  全部分类
                </Link>
              </li>
              {parentCategories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/courses?category=${cat.slug}`}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium ${searchParams.category === cat.slug ? "bg-primary-50 text-primary-600" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    {cat.icon} {cat.name}
                  </Link>
                  {cat.children.length > 0 && (
                    <ul className="ml-3 mt-1 space-y-0.5 border-l border-gray-100 pl-2">
                      {cat.children.map((sub) => (
                        <li key={sub.id}>
                          <Link
                            href={`/courses?category=${sub.slug}`}
                            className={`block px-3 py-1.5 rounded-lg text-sm ${searchParams.category === sub.slug ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-500 hover:bg-gray-50"}`}
                          >
                            {sub.icon} {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
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
              placeholder="搜索课程名称..."
              className="input-field flex-1"
            />
            {searchParams.category && (
              <input type="hidden" name="category" value={searchParams.category} />
            )}
            <button type="submit" className="btn-primary px-8">搜索</button>
          </form>

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">
              {selectedCat
                ? `${selectedCat.icon || ""} ${selectedCat.name}`
                : "全部课程"}
              <span className="text-gray-400 text-lg ml-2">({total})</span>
            </h1>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">📭</div>
              <p>暂无课程，换个关键词试试</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {courses.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`} className="card group overflow-hidden">
                  <div className="h-44 bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
                    {course.cover ? (
                      <img
                        src={course.cover}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">📖</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">
                        {course.category?.name}
                      </span>
                    </div>
                    <h3 className="font-semibold group-hover:text-primary-600 transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    <div className="text-xs text-gray-400 mt-1">{course.institution?.name}</div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold text-accent-600">
                        {formatPrice(course.price)}
                      </span>
                      {course.originalPrice && parseFloat(course.originalPrice) > parseFloat(course.price || "0") && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(course.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-10 gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <Link
                  key={i}
                  href={`/courses?${new URLSearchParams({ ...searchParams, page: String(i + 1) } as any).toString()}`}
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
