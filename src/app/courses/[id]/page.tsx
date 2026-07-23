import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";
import ContactButton from "@/components/ContactButton";
import FavoriteButton from "@/components/FavoriteButton";
import ReviewList from "@/components/ReviewList";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbLd } from "@/lib/seo";
import Faq from "@/components/seo/Faq";
import { getCourseFaqs } from "@/lib/faq";

export const revalidate = 60; // ISR: 避免每次请求连远程 Turso 超时

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const course = await prisma.course.findUnique({
    where: { id: params.id },
    select: { title: true, description: true, category: { select: { name: true } } },
  });
  if (!course) return { title: "课程未找到" };
  return {
    title: `${course.title} - ${course.category?.name || "课程详情"}`,
    description: course.description || `${course.title}，厦门培训网优质培训课程`,
  };
}

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      institution: true,
      category: true,
      reviews: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!course) notFound();

  // Check if current user favorited this course
  const session = await auth();
  let isFavorited = false;
  let currentUserId: string | undefined;
  if (session?.user) {
    currentUserId = session.user.id;
    const fav = await prisma.favorite.findFirst({
      where: { userId: currentUserId, courseId: course.id },
    });
    isFavorited = !!fav;
  }

  // Compute review stats
  const reviewCount = course.reviews.length;
  const avgRating = reviewCount > 0
    ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0;

  const relatedCourses = await prisma.course.findMany({
    where: { categoryId: course.categoryId, id: { not: course.id }, status: "ACTIVE" },
    include: { institution: true },
    take: 4,
  });

  // 结构化数据：Course + 面包屑
  const courseUrl = `${SITE_URL}/courses/${course.id}`;
  const courseLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    ...(course.description ? { description: course.description } : {}),
    url: courseUrl,
    ...(course.cover ? { image: course.cover } : {}),
    ...(course.category?.name ? { keywords: course.category.name } : {}),
    provider: {
      "@type": "Organization",
      name: course.institution?.name || SITE_NAME,
      ...(course.institution?.phone ? { telephone: course.institution.phone } : {}),
    },
    offers: {
      "@type": "Offer",
      price: course.price ? Number(course.price) : 0,
      priceCurrency: "CNY",
      availability: "https://schema.org/InStock",
      url: courseUrl,
    },
    ...(reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(avgRating.toFixed(1)),
            reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
  const courseBreadcrumb = breadcrumbLd([
    { name: "首页", path: "/" },
    { name: "课程", path: "/courses" },
    { name: course.title, path: `/courses/${course.id}` },
  ]);

  return (
    <div className="container-main py-8">
      <JsonLd data={[courseLd, courseBreadcrumb]} />
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">首页</Link>
        <span className="mx-2">/</span>
        <Link href="/courses" className="hover:text-primary-600">课程</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{course.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-8">
          {/* Cover image */}
          {course.cover && (
            <div className="rounded-2xl overflow-hidden shadow-sm h-48 md:h-64 relative">
              <Image
                src={course.cover}
                alt={course.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 66vw"
              />
            </div>
          )}

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
            <div className="flex items-start justify-between mb-4">
              <span className="text-sm bg-primary-50 text-primary-600 px-3 py-1 rounded-full inline-block">
                {course.category?.name}
              </span>
              <FavoriteButton
                courseId={course.id}
                initialFavorited={isFavorited}
                variant="icon"
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-4">{course.title}</h1>

            {/* Rating summary */}
            {reviewCount > 0 && (
              <div className="flex items-center gap-2 mb-4 text-sm">
                <span className="text-yellow-400 text-lg">
                  {"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}
                </span>
                <span className="font-bold text-lg">{avgRating.toFixed(1)}</span>
                <span className="text-gray-400">{reviewCount} 条评价</span>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-lg font-bold text-primary-600">
                {course.institution?.name?.slice(0, 2)}
              </div>
              <div>
                <Link href={`/institutions/${course.institutionId}`} className="font-medium text-primary-600 hover:underline">
                  {course.institution?.name}
                </Link>
                <div className="text-sm text-gray-400">{course.institution?.district}</div>
              </div>
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-accent-600">{formatPrice(course.price)}</span>
              {course.originalPrice && parseFloat(course.originalPrice) > parseFloat(course.price || "0") && (
                <span className="text-lg text-gray-400 line-through">{formatPrice(course.originalPrice)}</span>
              )}
            </div>

            {course.description && (
              <div className="prose max-w-none text-gray-600 leading-relaxed">
                <h3 className="text-lg font-bold text-gray-900 mb-2">课程介绍</h3>
                <p>{course.description}</p>
              </div>
            )}

            {/* 选课建议（基于真实数据的长尾引导段，提升正文相关词密度） */}
            <div className="mt-4 bg-primary-50/60 rounded-xl p-4 text-sm text-gray-600 leading-relaxed">
              在厦门{course.institution?.district || "本地"}学习{course.category?.name || "培训"}课程，
              {course.institution?.name}提供「{course.title}」课程，参考价格 {formatPrice(course.price)}。
              建议先预约试听，结合师资与学员评价对比后再报名。
            </div>

            {/* 课程信息结构化卡 */}
            <div className="mt-4 bg-gray-50 rounded-xl p-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div><div className="text-gray-400 mb-1">参考价格</div><div className="font-semibold text-accent-600">{formatPrice(course.price)}</div></div>
              <div><div className="text-gray-400 mb-1">所属机构</div><div className="font-semibold">{course.institution?.name || "-"}</div></div>
              <div><div className="text-gray-400 mb-1">所在区域</div><div className="font-semibold">{course.institution?.district || "-"}</div></div>
              <div><div className="text-gray-400 mb-1">课程分类</div><div className="font-semibold">{course.category?.name || "-"}</div></div>
              <div><div className="text-gray-400 mb-1">学员评分</div><div className="font-semibold">{reviewCount > 0 ? `${avgRating.toFixed(1)}（${reviewCount} 条）` : "暂无"}</div></div>
              <div><div className="text-gray-400 mb-1">更新时间</div><div className="font-semibold">{new Date(course.updatedAt).toLocaleDateString("zh-CN")}</div></div>
            </div>

            {/* Contact + favorite buttons */}
            <div className="mt-8 pt-6 border-t flex flex-wrap gap-3 items-center">
              <ContactButton
                courseId={course.id}
                institutionId={course.institutionId}
                institutionName={course.institution?.name}
                phone={course.institution?.phone ?? undefined}
              />
              <FavoriteButton
                courseId={course.id}
                initialFavorited={isFavorited}
              />
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8 mt-8">
            <h2 className="text-xl font-bold mb-6">学员评价</h2>
            <ReviewList
              courseId={course.id}
              currentUserId={currentUserId}
            />
          </div>

          <Faq items={getCourseFaqs(course, course.institution)} />
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="font-bold mb-4">机构信息</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between"><span>机构名称</span><span className="font-medium">{course.institution?.name}</span></div>
              <div className="flex justify-between"><span>所在区域</span><span>{course.institution?.district}</span></div>
              <div className="flex justify-between"><span>联系电话</span><span>{course.institution?.phone}</span></div>
              <div className="flex justify-between"><span>课程分类</span><span>{course.category?.name}</span></div>
            </div>
            <Link href={`/institutions/${course.institutionId}`} className="btn-secondary w-full block text-center mt-4">
              查看机构详情
            </Link>
          </div>
        </aside>
      </div>

      {/* Related courses */}
            {relatedCourses.length > 0 && (
              <section className="mt-16">
                <h2 className="text-2xl font-bold mb-6">相关课程推荐</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {relatedCourses.map((c) => (
                    <Link key={c.id} href={`/courses/${c.id}`} className="card group overflow-hidden">
                      <div className="h-36 bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden relative">
                        {c.cover ? (
                          <Image src={c.cover} alt={c.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="25vw" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">📖</div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-sm group-hover:text-primary-600 transition-colors line-clamp-2">{c.title}</h3>
                        <div className="text-xs text-gray-400 mt-1">{c.institution?.name}</div>
                        <div className="text-lg font-bold text-accent-600 mt-2">{formatPrice(c.price)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
    </div>
  );
}
