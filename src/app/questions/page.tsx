import Link from "next/link";
import { createClient } from "@libsql/client";
import { QA_CATEGORIES, getQaCategory } from "@/lib/qa";
import { SITE_NAME } from "@/lib/constants";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

// 裸 libsql client（经探针与诊断路由双重验证可用）。
// 注意：本页刻意不用 @/lib/prisma 的 Prisma 客户端——@prisma/adapter-libsql
// 在 Vercel 上对 libsql:// 的连接处理与裸 client 不一致，会连到无表上下文，
// 导致 no such table: main.Question（即便同库同 token 裸 client 能查到 22 张表）。
function getClient() {
  return createClient({
    url: process.env.DATABASE_URL ?? "",
    authToken: (process.env.TURSO_AUTH_TOKEN ?? "").trim() || undefined,
  });
}

type QRow = {
  id: string;
  title: string;
  content: string;
  category: string;
  views: number;
  createdAt: string;
  authorName: string | null;
  answers: number;
};

export function generateMetadata(): Metadata {
  return {
    title: `问答社区 - ${SITE_NAME}`,
    description:
      "厦门本地培训问答社区：福利活动、机构测评、政策答疑、本地补贴申领、培训经验交流，人工审核防广告。",
    alternates: { canonical: "/questions" },
  };
}

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: { cat?: string; sent?: string };
}) {
  const cat = searchParams.cat || "";
  const sent = searchParams.sent === "1";
  const activeCat = cat ? getQaCategory(cat) : undefined;

  const db = getClient();

  // 话题列表（含作者名、已审核回答数）
  const listSql = cat
    ? `SELECT q.id, q.title, q.content, q.category, q.views, q.createdAt,
              u.name AS authorName,
              (SELECT COUNT(*) FROM Answer a WHERE a.questionId = q.id AND a.isPublic = 1) AS answers
       FROM Question q LEFT JOIN User u ON u.id = q.authorId
       WHERE q.isPublic = 1 AND q.category = ?
       ORDER BY q.createdAt DESC LIMIT 30`
    : `SELECT q.id, q.title, q.content, q.category, q.views, q.createdAt,
              u.name AS authorName,
              (SELECT COUNT(*) FROM Answer a WHERE a.questionId = q.id AND a.isPublic = 1) AS answers
       FROM Question q LEFT JOIN User u ON u.id = q.authorId
       WHERE q.isPublic = 1
       ORDER BY q.createdAt DESC LIMIT 30`;
  const listRes = await db.execute({
    sql: listSql,
    args: cat ? [cat] : [],
  });
  const questions = listRes.rows.map((r) => {
    const row = r as unknown as Record<string, unknown>;
    return {
      id: String(row.id),
      title: String(row.title),
      content: String(row.content),
      category: String(row.category),
      views: Number(row.views ?? 0),
      createdAt: String(row.createdAt),
      authorName: row.authorName == null ? null : String(row.authorName),
      answers: Number(row.answers ?? 0),
    } as QRow;
  });

  // 各分类公开提问数
  const catKeys = QA_CATEGORIES.filter((c) => c.key).map((c) => c.key as string);
  const countMap: Record<string, number> = {};
  await Promise.all(
    catKeys.map(async (k) => {
      const res = await db.execute({
        sql: "SELECT COUNT(*) AS c FROM Question WHERE isPublic = 1 AND category = ?",
        args: [k],
      });
      const row = res.rows[0] as unknown as Record<string, unknown>;
      countMap[k] = Number(row.c ?? 0);
    })
  );

  return (
    <div className="container-main py-8">
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-primary-600">
          首页
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">问答社区</span>
      </div>

      {sent && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-6">
          ✅ 提问已提交，管理员审核通过后将公开展示
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">问答社区</h1>
          <p className="text-gray-500 mt-1">找培训、问政策、避坑指南——真实学员经验分享，人工审核防广告</p>
        </div>
        <Link href="/questions/ask" className="btn-primary px-6 py-3 text-base shrink-0">
          + 我要提问
        </Link>
      </div>

      {/* 五大板块 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {QA_CATEGORIES.map((c) => {
          const isActive = activeCat?.key === c.key;
          return (
            <Link
              key={c.key}
              href={`/questions${c.key ? `?cat=${c.key}` : ""}`}
              className={`rounded-2xl border p-4 transition-colors ${
                isActive
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/40"
              }`}
            >
              <div className="text-2xl mb-1">{c.icon}</div>
              <div className="font-semibold text-gray-800">{c.name}</div>
              <div className="text-xs text-gray-500 mt-1 leading-snug">{c.desc}</div>
              <div className="text-xs text-primary-600 mt-2">{countMap[c.key] || 0} 个话题</div>
            </Link>
          );
        })}
      </div>

      {/* 话题列表 */}
      <div>
        <h2 className="text-lg font-bold mb-4">
          {activeCat ? `${activeCat.icon} ${activeCat.name}` : "最新话题"}
          <span className="text-gray-400 text-base ml-2">({questions.length})</span>
        </h2>

        {questions.length === 0 ? (
          <div className="text-center text-gray-400 py-16 bg-white rounded-2xl border">
            <div className="text-4xl mb-3">💬</div>
            <p>该板块还没有公开话题，快来提出第一个问题吧！</p>
            <Link href="/questions/ask" className="btn-primary inline-block mt-4 px-6 py-2.5 text-sm">
              我要提问
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => {
              const c = getQaCategory(q.category);
              return (
                <Link
                  key={q.id}
                  href={`/questions/${q.id}`}
                  className="block bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {c && (
                      <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">
                        {c.icon} {c.name}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {q.answers} 条回复 · {q.views} 浏览
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg hover:text-primary-600 line-clamp-1">
                    {q.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{q.content}</p>
                  <div className="text-xs text-gray-400 mt-2">
                    提问者：{q.authorName || "匿名"} ·{" "}
                    {new Date(q.createdAt).toLocaleDateString("zh-CN")}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
