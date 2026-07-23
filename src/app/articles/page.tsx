import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AdSlot from "@/components/ad/AdSlot";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 60; // ISR: 避免每次请求连远程 Turso 超时

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "教育资讯 - 厦门培训网",
    description:
      "厦门教育培训政策解读、考试资讯、机构测评与学习攻略，帮你选对课程、避开套路。",
    alternates: { canonical: `${SITE_URL}/articles` },
  };
}

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  return (
    <div className="container-main py-8">
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">首页</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">教育资讯</span>
      </div>

      <h1 className="text-2xl font-bold mb-8">教育资讯</h1>

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
            <Link key={article.id} href={`/articles/${article.id}`} className="card p-6 group">
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
                <div className="text-xs text-gray-400 mt-4">
                  {new Date(article.publishedAt).toLocaleDateString("zh-CN")}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
