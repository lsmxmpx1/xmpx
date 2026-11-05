import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DISTRICTS } from "@/lib/utils";
import { SITE_NAME, SITE_DESC } from "@/lib/constants";
import AdSlot from "@/components/ad/AdSlot";
import InstitutionsMapPanel from "@/components/institutions/InstitutionsMapPanel";
import type { Metadata } from "next";

// 首页使用 ISR 缓存：构建时预渲染，之后每 60s 重新验证。
// 避免 force-dynamic 导致每次请求都连远程 Turso 触发 Vercel 函数 10s 超时。
export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  // 数据库查询包 .catch 兜底：构建期(ISR 预渲染)或运行时若远程 Turso 短暂不可达/
  // 出现偶发异常，降级为空数据而非整页 500 / 构建失败。生产表结构缺失请走 DDL 补齐。
  // TODO: 首页统计条（入驻机构/培训课程/用户评价/认证老师/覆盖区域）因数据量不足已临时下线，
  // 有数据后恢复 stats count 查询 + Stats 区块（可参考 git 历史中 cccfde9 版本）。
  const articles = await prisma.article
    .findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 6,
    })
    .catch(() => []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white py-8 md:py-12">
        <div className="container-main text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{SITE_DESC}</h1>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            汇聚厦门本地优质培训机构，覆盖K12辅导、兴趣培养、职业技能、考证培训等全品类课程
          </p>
          {/* Search Bar */}
          <form action="/search" className="max-w-2xl mx-auto flex gap-2">
            <input
              type="text"
              name="q"
              placeholder="搜索课程、机构、老师、培训资讯..."
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

      {/* Stats 统计条：数据量不足已临时下线，有数据后恢复（见上方 TODO） */}

      {/* HOME_TOP 广告位 */}
      <AdSlot position={["HOME_TOP", "HOME_BANNER"]} variant="banner" className="container-main mt-8" />

      {/* 主内容 - 居中展示 */}
      <div className="container-main py-8">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* 培训资讯 */}
            <section>
              <div className="flex justify-between items-end mb-10">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">培训资讯</h2>
                  <p className="text-gray-500 mt-2">最新培训政策、选课攻略、学习建议</p>
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

            {/* 在地图上找机构 */}
            <section>
              <div className="flex justify-between items-end mb-10">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">在地图上找机构</h2>
                  <p className="text-gray-500 mt-2">全市培训机构与教育局备案机构分布，按区域或就近筛选</p>
                </div>
                <Link href="/institutions" className="text-primary-600 font-medium hover:underline">
                  进入找机构 →
                </Link>
              </div>
              <InstitutionsMapPanel defaultOpen />
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

          </div>

      {/* HOME_SIDEBAR 广告位 */}
      <div className="container-main mt-4">
        <AdSlot position={["HOME_SIDEBAR", "HOME_FEATURED"]} variant="banner" title="推荐" />
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
