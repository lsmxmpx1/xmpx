import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice, DISTRICTS } from "@/lib/utils";
import { SITE_NAME, SITE_DESC } from "@/lib/constants";
import AdSlot from "@/components/ad/AdSlot";

// 首页使用 ISR 缓存：构建时预渲染，之后每 60s 重新验证。
// 避免 force-dynamic 导致每次请求都连远程 Turso 触发 Vercel 函数 10s 超时。
export const revalidate = 60;

/** 格式化首页统计数字：>=10000 显示"X万+"，否则加逗号 */
function formatStatNumber(n: number): string {
  if (n >= 10_000) {
    const wan = Math.floor(n / 10_000);
    return n % 10_000 === 0 ? `${wan}万+` : `${wan}万+`;
  }
  return n.toLocaleString("zh-CN");
}

export default async function HomePage() {
  const [institutions, courses, articles, categoriesRaw, stats] = await Promise.all([
    prisma.institution.findMany({
      where: { status: "APPROVED" },
      orderBy: { rating: "desc" },
      take: 8,
    }),
    prisma.course.findMany({
      where: { status: "ACTIVE" },
      include: { institution: true, category: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.article.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
    prisma.category.findMany({
      where: { parentId: null },
      include: { children: { orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    }),
    // 统计数据：从数据库实时读取
    Promise.all([
      prisma.institution.count({ where: { status: "APPROVED" } }),
      prisma.course.count({ where: { status: "ACTIVE" } }),
      prisma.review.count(),
      prisma.teacher.count(),
      DISTRICTS.length,
    ]),
  ]);

  // 首页热门分类展示顺序：第一行 4 个（中小学辅导 / 体育运动 / 学历提升 / 考证培训），其余放第二行
  const HOME_CAT_ORDER = ["k12", "sports", "degree", "certification", "art", "vocational", "language"];
  const categories = [...categoriesRaw].sort((a, b) => {
    const ia = HOME_CAT_ORDER.indexOf(a.slug);
    const ib = HOME_CAT_ORDER.indexOf(b.slug);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white py-8 md:py-12">
        <div className="container-main text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{SITE_DESC}</h1>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            汇聚厦门本地2000+优质培训机构，覆盖K12辅导、兴趣培养、职业技能、考证培训等全品类课程
          </p>
          {/* Search Bar */}
          <form action="/search" className="max-w-2xl mx-auto flex gap-2">
            <input
              type="text"
              name="q"
              placeholder="搜索课程、机构、老师..."
              className="flex-1 px-5 py-4 rounded-xl text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            <button type="submit" className="btn-accent px-8 py-4 rounded-xl text-lg font-bold">
              搜索
            </button>
          </form>
          <div className="mt-4 flex justify-center gap-2 flex-wrap">
            {["英语培训", "美术班", "编程", "游泳", "考驾照"].map((kw) => (
              <Link
                key={kw}
                href={`/search?q=${kw}`}
                className="text-sm bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors"
              >
                {kw}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white -mt-8 relative z-10 container-main">
        <div className="grid grid-cols-5 divide-x bg-white rounded-2xl shadow-lg p-6">
          {[
            { value: formatStatNumber(stats[0]), label: "入驻机构" },
            { value: formatStatNumber(stats[1]), label: "培训课程" },
            { value: formatStatNumber(stats[2]), label: "用户评价" },
            { value: formatStatNumber(stats[3]), label: "认证老师" },
            { value: String(stats[4]), label: "覆盖区域" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary-600">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOME_TOP 广告位 */}
      <AdSlot position={["HOME_TOP", "HOME_BANNER"]} variant="banner" className="container-main mt-8" />

      {/* 主内容 + 侧栏 */}
      <div className="container-main py-8">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0 space-y-12">
            {/* Category Navigation */}
            <section>
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold">热门培训分类</h2>
                <p className="text-gray-500 mt-2">选择你感兴趣的培训方向，发现优质课程</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((cat) => (
                  <div key={cat.id} className="bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md transition-shadow">
                    <Link href={`/courses/category/${cat.slug}`} className="flex items-center gap-3 mb-3 group">
                      <span className="text-3xl">{cat.icon}</span>
                      <span className="text-lg font-bold text-gray-800 group-hover:text-primary-600 transition-colors">{cat.name}</span>
                    </Link>
                    <div className="flex flex-wrap gap-2">
                      {cat.children.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/courses/category/${sub.slug}`}
                          className="text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
                        >
                          {sub.icon} {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recommended Institutions */}
            <section className="bg-white rounded-2xl p-6">
              <div className="flex justify-between items-end mb-10">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">推荐机构</h2>
                  <p className="text-gray-500 mt-2">高评分优质培训机构</p>
                </div>
                <Link href="/institutions" className="text-primary-600 font-medium hover:underline">
                  查看全部 →
                </Link>
              </div>
              {institutions.length === 0 ? (
                <div className="text-center text-gray-400 py-12">暂无机构数据，请先添加种子数据</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {institutions.map((inst) => (
                    <Link key={inst.id} href={`/institutions/${inst.id}`} className="card overflow-hidden group">
                      {/* Cover image */}
                      <div className="h-32 bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden">
                        {inst.cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={inst.cover}
                            alt={inst.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">🏫</div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {inst.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={inst.logo}
                              alt={inst.name}
                              className="w-10 h-10 rounded-xl object-cover border"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-sm font-bold text-primary-600">
                              {inst.name.slice(0, 2)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-800 truncate group-hover:text-primary-600 transition-colors">{inst.name}</div>
                            <div className="text-xs text-gray-400">{inst.district}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <span className="text-orange-400">★</span>
                          <span>{inst.rating.toFixed(1)}</span>
                          <span className="mx-1">·</span>
                          <span>{inst.reviewCount}条评价</span>
                          <span className="mx-1">·</span>
                          <span>{inst.courseCount}门课程</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Latest Courses */}
            <section>
              <div className="flex justify-between items-end mb-10">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">最新课程</h2>
                  <p className="text-gray-500 mt-2">近期上新的热门培训课程</p>
                </div>
                <Link href="/courses" className="text-primary-600 font-medium hover:underline">
                  查看全部 →
                </Link>
              </div>
              {courses.length === 0 ? (
                <div className="text-center text-gray-400 py-12">暂无课程数据，请先添加种子数据</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {courses.map((course) => (
                    <Link key={course.id} href={`/courses/${course.id}`} className="card group overflow-hidden">
                      <div className="h-40 bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden">
                        {course.cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
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
                        <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">
                          {course.category?.name}
                        </span>
                        <h3 className="font-semibold mt-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                          {course.title}
                        </h3>
                        <div className="text-xs text-gray-400 mt-1">{course.institution?.name}</div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-lg font-bold text-accent-600">{formatPrice(course.price)}</span>
                          <span className="text-xs text-gray-400">详情 →</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* District Quick Links */}
            <section className="bg-white rounded-2xl p-6">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">按区域找培训</h2>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {DISTRICTS.map((d) => (
                  <Link
                    key={d}
                    href={`/institutions?district=${d}`}
                    className="card py-4 text-center font-medium text-gray-700 hover:text-primary-600"
                  >
                    {d}
                  </Link>
                ))}
              </div>
            </section>

            {/* Articles */}
            <section>
              <div className="flex justify-between items-end mb-10">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">教育资讯</h2>
                  <p className="text-gray-500 mt-2">最新教育政策、考试信息、学习攻略</p>
                </div>
                <Link href="/articles" className="text-primary-600 font-medium hover:underline">
                  查看全部 →
                </Link>
              </div>
              {articles.length === 0 ? (
                <div className="text-center text-gray-400 py-12">暂无资讯，请先添加种子数据</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {articles.map((article) => (
                    <Link key={article.id} href={`/articles/${article.id}`} className="card group overflow-hidden">
                      {article.cover ? (
                        <div className="h-40 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={article.cover}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : null}
                      <div className="p-5">
                        {article.category && (
                          <span className="text-xs bg-accent-50 text-accent-600 px-2 py-0.5 rounded-full">
                            {article.category}
                          </span>
                        )}
                        <h3 className="font-semibold mt-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        {article.summary && (
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{article.summary}</p>
                        )}
                        {article.publishedAt && (
                          <div className="text-xs text-gray-400 mt-3">
                            {new Date(article.publishedAt).toLocaleDateString("zh-CN")}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* HOME_SIDEBAR 广告位 */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <AdSlot position={["HOME_SIDEBAR", "HOME_FEATURED"]} variant="sidebar" title="推荐" />
            </div>
          </aside>
        </div>
      </div>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container-main text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">您是培训机构？</h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            免费入驻{SITE_NAME}，展示你的课程，获得更多学员报名
          </p>
          <Link href="/dashboard" className="inline-block bg-white text-primary-600 font-bold px-8 py-3 rounded-xl text-lg hover:shadow-xl transition-shadow">
            立即入驻
          </Link>
        </div>
      </section>
    </div>
  );
}
