import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    select: { name: true, parentId: true, parent: { select: { name: true } } },
  });
  if (!category) return { title: "课程分类" };
  const fullName = category.parent ? `${category.parent.name} · ${category.name}` : category.name;
  return {
    title: `${fullName} - 厦门培训课程`,
    description: `厦门${fullName}培训课程大全，找优质${category.name}培训机构和课程`,
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: { parent: true, children: true },
  });
  if (!category) {
    return (
      <div className="container-main py-20 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold mb-2">分类不存在</h1>
        <Link href="/courses" className="text-primary-600 hover:underline">返回课程列表</Link>
      </div>
    );
  }

  // If parent category, include courses from itself and all children
  const categoryIds = category.children.length > 0
    ? [category.id, ...category.children.map((c) => c.id)]
    : [category.id];

  const courses = await prisma.course.findMany({
    where: { categoryId: { in: categoryIds }, status: "ACTIVE" },
    include: { institution: true, category: true },
    orderBy: { createdAt: "desc" },
    take: 24,
  });

  const displayName = category.parent ? `${category.parent.name} · ${category.name}` : category.name;

  return (
    <div className="container-main py-8">
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">首页</Link>
        <span className="mx-2">/</span>
        <Link href="/courses" className="hover:text-primary-600">课程分类</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{category.name}</span>
      </div>

      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold">
          {category.icon} {displayName}
        </h1>
        <p className="mt-2 text-white/80">共找到 {courses.length} 个相关课程</p>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📭</div>
          <p>该分类下暂无课程</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`} className="card group overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden relative">
                {course.cover ? (
                  <Image
                    src={course.cover}
                    alt={course.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">📖</div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold group-hover:text-primary-600 transition-colors line-clamp-2">{course.title}</h3>
                <div className="text-xs text-gray-400 mt-1">{course.institution?.name}</div>
                <div className="text-lg font-bold text-accent-600 mt-2">{formatPrice(course.price)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
