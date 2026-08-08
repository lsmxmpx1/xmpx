import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AdSlot from "@/components/ad/AdSlot";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 60; // ISR: 避免每次请求连远程 Turso 超时

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "培训资讯 - 厦门培训网",
    description:
      "厦门培训政策解读、选课攻略、机构测评与学习建议，帮你选对课程、避开套路。",
    alternates: { canonical: `${SITE_URL}/articles` },
  };
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page || "1") || 1);
  const pageSize = 12;

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.article.count({ where: { published: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  return (
    <div className="container-main py-8">
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">首页</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">培训资讯</span>
      </div>

      <h1 className="text-2xl font-bold mb-8">
        培训资讯
        <span className="text-gray-400 text-lg ml-2">({total})</span>
      </h1>

      {/* ARTICLE_LIST 广告位 */}
      <AdSlot position="ARTICLE_LIST" variant="banner" className="mb-8" />

      {articles.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📰</div>
          <p>暂无资讯，请先添加种子数据</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <span className="text-xs bg-accent-50 text-accent-600 px-2 py-0.5 rounded-full inline-block mb-3">
                    {article.category}
                  </span>
                )}
                <h2 className="font-bold text-lg group-hover:text-primary-600 transition-colors line-clamp-2 mb-2">
                  {article.title}
                </h2>
                {article.summary && (
                  <p className="text-sm text-gray-500 line-clamp-2">{article.summary}</p>
                )}
                {article.publishedAt && (
                  <div className="text-xs text-gray-400 mt-4 flex items-center gap-3">
                    <span>{new Date(article.publishedAt).toLocaleDateString("zh-CN")}</span>
                    <span>{article.views ?? 0} 次浏览</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-10 gap-2">
          {currentPage > 1 && (
            <Link
              href={`/articles?page=${currentPage - 1}`}
              className="w-10 h-10 rounded-lg flex items-center justify-center font-medium bg-white border text-gray-600 hover:bg-gray-50"
            >
              ‹
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => (
            <Link
              key={i}
              href={`/articles?page=${i + 1}`}
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium ${currentPage === i + 1 ? "bg-primary-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"}`}
            >
              {i + 1}
            </Link>
          ))}
          {currentPage < totalPages && (
            <Link
              href={`/articles?page=${currentPage + 1}`}
              className="w-10 h-10 rounded-lg flex items-center justify-center font-medium bg-white border text-gray-600 hover:bg-gray-50"
            >
              ›
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
