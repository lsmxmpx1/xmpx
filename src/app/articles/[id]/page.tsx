import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbLd } from "@/lib/seo";
import Faq from "@/components/seo/Faq";
import { getArticleFaqs } from "@/lib/faq";
import { renderMarkdown } from "@/lib/markdown";
import ArticleViewTracker from "@/components/ArticleViewTracker";

export const revalidate = 60; // ISR: 避免每次请求连远程 Turso 超时

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    select: { title: true, summary: true, category: true },
  });
  if (!article) return { title: "文章未找到" };
  return {
    title: article.title,
    description: article.summary || `${article.title} - 厦门培训网培训咨询`,
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

  // 结构化数据：BlogPosting + 面包屑
  const articleUrl = `${SITE_URL}/articles/${article.id}`;
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    url: articleUrl,
    ...(article.summary ? { description: article.summary } : {}),
    ...(article.cover ? { image: article.cover } : {}),
    ...(article.publishedAt ? { datePublished: new Date(article.publishedAt).toISOString() } : {}),
    ...(article.updatedAt ? { dateModified: new Date(article.updatedAt).toISOString() } : {}),
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
  };
  const articleBreadcrumb = breadcrumbLd([
    { name: "首页", path: "/" },
    { name: "培训咨询", path: "/articles" },
    { name: article.title, path: `/articles/${article.id}` },
  ]);

  return (
    <div className="container-main py-8">
      <JsonLd data={[articleLd, articleBreadcrumb]} />
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
          {article.cover && (
            <div className="mb-6 overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.cover}
                alt={article.title}
                className="w-full object-cover max-h-96"
              />
            </div>
          )}
          <h1 className="text-2xl md:text-3xl font-bold mb-4">{article.title}</h1>
          {article.publishedAt && (
            <div className="text-sm text-gray-400 mb-8 flex items-center gap-4">
              <span>发布于 {new Date(article.publishedAt).toLocaleDateString("zh-CN")}</span>
              <ArticleViewTracker id={article.id} initialViews={article.views ?? 0} />
            </div>
          )}

          {article.summary && (
            <div className="bg-gray-50 rounded-xl p-4 mb-8 text-gray-600 italic border-l-4 border-primary-500">
              {article.summary}
            </div>
          )}

          {article.content ? (
            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
            />
          ) : (
            <div className="text-gray-400">暂无详细内容</div>
          )}
        </div>

        <Faq items={getArticleFaqs()} />

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
