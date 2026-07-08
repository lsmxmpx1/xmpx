import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    select: { title: true, summary: true, category: true },
  });
  if (!article) return { title: "文章未找到" };
  return {
    title: article.title,
    description: article.summary || `${article.title} - 厦门培训网教育资讯`,
  };
}

export default async function ArticleDetailPage({ params }: { params: { id: string } }) {
  const article = await prisma.article.findUnique({ where: { id: params.id } });
  if (!article) notFound();

  const related = await prisma.article.findMany({
    where: { published: true, id: { not: article.id } },
    orderBy: { publishedAt: "desc" },
    take: 4,
  });

  return (
    <div className="container-main py-8">
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">首页</Link>
        <span className="mx-2">/</span>
        <Link href="/articles" className="hover:text-primary-600">资讯</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{article.title}</span>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-10">
          {article.category && (
            <span className="text-sm bg-accent-50 text-accent-600 px-3 py-1 rounded-full inline-block mb-4">
              {article.category}
            </span>
          )}
          <h1 className="text-2xl md:text-3xl font-bold mb-4">{article.title}</h1>
          {article.publishedAt && (
            <div className="text-sm text-gray-400 mb-8">
              发布于 {new Date(article.publishedAt).toLocaleDateString("zh-CN")}
            </div>
          )}

          {article.summary && (
            <div className="bg-gray-50 rounded-xl p-4 mb-8 text-gray-600 italic border-l-4 border-primary-500">
              {article.summary}
            </div>
          )}

          <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {article.content || "暂无详细内容"}
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-6">相关阅读</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map((a) => (
                <Link key={a.id} href={`/articles/${a.id}`} className="card p-5 group">
                  {a.category && <span className="text-xs bg-accent-50 text-accent-600 px-2 py-0.5 rounded-full">{a.category}</span>}
                  <h3 className="font-semibold mt-2 group-hover:text-primary-600 line-clamp-2">{a.title}</h3>
                  {a.publishedAt && <div className="text-xs text-gray-400 mt-2">{new Date(a.publishedAt).toLocaleDateString("zh-CN")}</div>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
