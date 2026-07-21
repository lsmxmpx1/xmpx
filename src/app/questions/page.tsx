import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { QA_CATEGORIES, getQaCategory } from "@/lib/qa";
import { SITE_NAME } from "@/lib/constants";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

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

  const [questions, counts] = await Promise.all([
    prisma.question.findMany({
      where: { isPublic: true, ...(cat ? { category: cat } : {}) },
      include: {
        author: { select: { name: true } },
        _count: { select: { answers: { where: { isPublic: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.question.groupBy({
      by: ["category"],
      where: { isPublic: true },
      _count: true,
    }),
  ]);

  const countMap: Record<string, number> = {};
  for (const c of counts) countMap[c.category] = c._count;

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
                      {q._count.answers} 条回复 · {q.views} 浏览
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg hover:text-primary-600 line-clamp-1">
                    {q.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{q.content}</p>
                  <div className="text-xs text-gray-400 mt-2">
                    提问者：{q.author?.name || "匿名"} ·{" "}
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
