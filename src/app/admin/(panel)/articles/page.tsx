import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtDateTime } from "@/lib/format";
import { deleteArticle, toggleArticlePublished } from "../actions";
import ArticleForm from "./ArticleForm";

export const dynamic = "force-dynamic";

export default async function AdminArticles({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim();
  const articles = await prisma.article.findMany({
    where: q ? { title: { contains: q } } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">文章管理</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">共 {articles.length} 条</span>
          <ArticleForm />
        </div>
      </div>

      <form className="mb-4 flex gap-2" method="get">
        <input name="q" defaultValue={q || ""} placeholder="按文章标题搜索" className="input-field max-w-sm" />
        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm">搜索</button>
        {q && (
          <Link href="/admin/articles" className="px-4 py-2 text-sm text-gray-500 hover:underline self-center">
            清除
          </Link>
        )}
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left p-3 font-medium">标题</th>
              <th className="text-left p-3 font-medium">分类</th>
              <th className="text-left p-3 font-medium">状态</th>
              <th className="text-left p-3 font-medium">创建时间</th>
              <th className="text-left p-3 font-medium">最后修改</th>
              <th className="text-right p-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-medium text-gray-800 line-clamp-1">{a.title}</div>
                  <div className="text-xs text-gray-400">{a.slug}</div>
                </td>
                <td className="p-3 text-gray-600">{a.category || "-"}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${a.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {a.published ? "已发布" : "草稿"}
                  </span>
                </td>
                <td className="p-3 text-gray-500 whitespace-nowrap">{fmtDateTime(a.createdAt)}</td>
                <td className="p-3 text-gray-500 whitespace-nowrap">{fmtDateTime(a.updatedAt)}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <ArticleForm
                      existing={{
                        id: a.id,
                        title: a.title,
                        slug: a.slug,
                        summary: a.summary,
                        content: a.content,
                        cover: a.cover,
                        category: a.category,
                        tags: a.tags,
                        published: a.published,
                      }}
                    />
                    <form action={toggleArticlePublished.bind(null, a.id)}>
                      <button className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-100">
                        {a.published ? "转草稿" : "发布"}
                      </button>
                    </form>
                    <form action={deleteArticle.bind(null, a.id)}>
                      <button className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50">删除</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">暂无文章</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
