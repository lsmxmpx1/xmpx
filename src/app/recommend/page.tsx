import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "精选推荐 - 厦门培训网",
  description: "厦门本地优质培训机构精选推荐，品质有保障，一站式对比选择。",
};

export const revalidate = 120; // 推荐页 ISR 120s（数据更新不频繁）

export default async function RecommendPage() {
  const [session, featuredInstitutions, hotCourses, stats] = await Promise.all([
    auth(),
    prisma.institution.findMany({
      where: { featured: true, status: "APPROVED" },
      orderBy: { rating: "desc" },
      include: {
        courses: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 3,
          include: { category: { select: { name: true, slug: true } } },
        },
      },
    }),
    prisma.course.findMany({
      where: { status: "ACTIVE", institution: { status: "APPROVED" } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        institution: { select: { id: true, name: true, logo: true, rating: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
    (async () => {
      const [instCount, courseCount, articleCount] = await Promise.all([
        prisma.institution.count({ where: { status: "APPROVED" } }),
        prisma.course.count({ where: { status: "ACTIVE" } }),
        prisma.article.count({ where: { published: true } }),
      ]);
      return { instCount, courseCount, articleCount };
    })(),
  ]);

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-blue-700 text-white">
        <div className="container-main py-10 md:py-12">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm mb-4">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              品质甄选
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
              厦门本地精选推荐
            </h1>
            <p className="text-lg text-white/80 mb-6 max-w-xl mx-auto">
              从 {stats.instCount}+ 机构中精心筛选，为您推荐最受好评的优质培训资源
            </p>
            <div className="flex flex-wrap justify-center gap-5 text-center">
              <div className="bg-white/10 rounded-xl px-5 py-3 backdrop-blur-sm">
                <div className="text-2xl font-bold">{stats.instCount}+</div>
                <div className="text-sm text-white/70 mt-1">入驻机构</div>
              </div>
              <div className="bg-white/10 rounded-xl px-5 py-3 backdrop-blur-sm">
                <div className="text-2xl font-bold">{stats.courseCount}+</div>
                <div className="text-sm text-white/70 mt-1">优质课程</div>
              </div>
              <div className="bg-white/10 rounded-xl px-5 py-3 backdrop-blur-sm">
                <div className="text-2xl font-bold">{stats.articleCount}+</div>
                <div className="text-sm text-white/70 mt-1">培训咨询</div>
              </div>
            </div>
          </div>
        </div>
        {/* Wave divider */}
        <div className="h-8 bg-white" style={{ clipPath: "ellipse(60% 100% at 50% 100%)" }} />
      </section>

      {/* Featured Institutions */}
      <section className="container-main py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            精选品牌机构
          </h2>
          <p className="text-gray-500">高口碑 · 品质教学 · 值得信赖</p>
        </div>

        <div className="grid gap-8">
          {featuredInstitutions.map((inst, idx) => (
            <div
              key={inst.id}
              className="bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row">
                {/* Cover Image */}
                <div className="lg:w-96 shrink-0 relative overflow-hidden">
                  {inst.cover ? (
                    <img
                      src={inst.cover}
                      alt={inst.name}
                      className="w-full h-48 lg:h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 lg:h-full bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center">
                      <span className="text-6xl">🏫</span>
                    </div>
                  )}
                  {/* Featured badge */}
                  {idx === 0 && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      热门推荐
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-6 lg:p-8">
                  <div className="flex items-start gap-4 mb-4">
                    {inst.logo && (
                      <img
                        src={inst.logo}
                        alt={inst.name}
                        className="w-14 h-14 rounded-xl object-cover border shrink-0"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-900">
                          <Link href={`/institutions/${inst.id}`} className="hover:text-primary-600 transition-colors">
                            {inst.name}
                          </Link>
                        </h3>
                        <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">
                          {inst.district}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="text-yellow-400">★</span> {inst.rating}
                        </span>
                        <span>·</span>
                        <span>{inst.reviewCount} 条评价</span>
                        <span>·</span>
                        <span>{inst.courseCount} 门课程</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-5 line-clamp-2">
                    {inst.description}
                  </p>

                  {/* Courses */}
                  {inst.courses.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                        热门课程
                      </h4>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {inst.courses.map((course) => (
                          <Link
                            key={course.id}
                            href={`/courses/${course.id}`}
                            className="block bg-gray-50 hover:bg-primary-50 rounded-xl p-3.5 transition-colors group"
                          >
                            <div className="text-sm font-medium text-gray-900 group-hover:text-primary-600 line-clamp-1 mb-1">
                              {course.title}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">
                                {course.category?.name}
                              </span>
                              {course.price && (
                                <span className="text-sm font-bold text-primary-600">
                                  ¥{course.price}
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    <Link
                      href={`/institutions/${inst.id}`}
                      className="btn-primary text-sm px-5 py-2"
                    >
                      查看机构详情
                    </Link>
                    <Link
                      href={`/institutions/${inst.id}#contact`}
                      className="btn-secondary text-sm px-5 py-2"
                    >
                      在线咨询
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {featuredInstitutions.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🏗️</div>
            <p>暂无精选机构，敬请期待...</p>
          </div>
        )}
      </section>

      {/* Hot Courses Grid */}
      <section className="bg-gray-50 py-12">
        <div className="container-main">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              热门课程推荐
            </h2>
            <p className="text-gray-500">最新最受欢迎的培训课程</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {hotCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all group"
              >
                {/* Course cover */}
                <div className="relative h-40 overflow-hidden">
                  {course.cover ? (
                    <img
                      src={course.cover}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center">
                      <span className="text-4xl">📚</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <span className="text-white text-xs font-medium">
                      {course.category?.name}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-medium text-gray-900 group-hover:text-primary-600 line-clamp-2 text-sm mb-3 transition-colors">
                    {course.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {course.institution?.logo && (
                        <img
                          src={course.institution.logo}
                          alt={course.institution.name}
                          className="w-5 h-5 rounded object-cover"
                        />
                      )}
                      <span className="text-xs text-gray-400 line-clamp-1">
                        {course.institution?.name}
                      </span>
                    </div>
                    {course.price && (
                      <span className="text-sm font-bold text-primary-600">
                        ¥{course.price}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container-main py-16">
        <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-2xl p-10 md:p-14 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            您的机构也想出现在这里？
          </h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">
            加入厦门培训网，获得更多曝光和生源。入驻即享免费基础展示，升级推广套餐获取更高排名。
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href={session ? "/dashboard/institution" : "/auth/register"}
              className="bg-white text-primary-600 font-semibold px-8 py-3 rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              {session ? "管理我的机构" : "立即入驻"}
            </Link>
            <Link
              href="/institutions"
              className="border-2 border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              浏览所有机构
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
