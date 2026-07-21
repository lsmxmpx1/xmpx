import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@libsql/client";
import { auth } from "@/lib/auth";
import { getQaCategory, QUESTION_STATUS_LABEL } from "@/lib/qa";
import { SITE_NAME } from "@/lib/constants";
import type { Metadata } from "next";
import AnswerForm from "@/components/qa/AnswerForm";
import QuestionViewTracker from "@/components/qa/QuestionViewTracker";

export const dynamic = "force-dynamic";

// 裸 libsql client。本页刻意不用 @/lib/prisma 的 Prisma 客户端：
// @prisma/adapter-libsql 在 Vercel 上连 libsql:// 时会落到无表上下文，
// 报 no such table: main.Question（同库同 token 裸 client 可正常查到 22 张表）。
function getClient() {
  return createClient({
    url: process.env.DATABASE_URL ?? "",
    authToken: (process.env.TURSO_AUTH_TOKEN ?? "").trim() || undefined,
  });
}

type QuestionRow = {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  isPublic: boolean;
  views: number;
  adminReply: string | null;
  createdAt: string;
  authorName: string | null;
};

type AnswerRow = {
  id: string;
  content: string;
  isBest: boolean;
  adminReply: string | null;
  authorName: string | null;
  authorUserName: string | null;
  createdAt: string;
};

function rowToQuestion(r: unknown): QuestionRow {
  const x = r as Record<string, unknown>;
  return {
    id: String(x.id),
    title: String(x.title),
    content: String(x.content),
    category: String(x.category),
    status: String(x.status),
    isPublic: Boolean(x.isPublic),
    views: Number(x.views ?? 0),
    adminReply: x.adminReply == null ? null : String(x.adminReply),
    createdAt: String(x.createdAt),
    authorName: x.authorName == null ? null : String(x.authorName),
  };
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  let q: { title: string; content: string; isPublic: boolean } | null = null;
  try {
    const db = getClient();
    const res = await db.execute({
      sql: "SELECT title, content, isPublic FROM Question WHERE id = ?",
      args: [params.id],
    });
    if (res.rows[0]) {
      const x = res.rows[0] as unknown as Record<string, unknown>;
      q = {
        title: String(x.title),
        content: String(x.content),
        isPublic: Boolean(x.isPublic),
      };
    }
  } catch {
    q = null;
  }

  if (!q || !q.isPublic) {
    return {
      title: "问题未公开 - 问答社区",
      robots: { index: false, follow: false },
    };
  }
  const desc = q.content.replace(/\s+/g, " ").trim().slice(0, 120);
  return {
    title: `${q.title} - 问答社区 - ${SITE_NAME}`,
    description: desc,
    alternates: { canonical: `/questions/${params.id}` },
    openGraph: {
      title: q.title,
      description: desc,
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default async function QuestionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const db = getClient();

  const qRes = await db.execute({
    sql: `SELECT q.id, q.title, q.content, q.category, q.status, q.isPublic, q.views,
                 q.adminReply, q.createdAt, u.name AS authorName
          FROM Question q LEFT JOIN User u ON u.id = q.authorId
          WHERE q.id = ?`,
    args: [params.id],
  });
  if (!qRes.rows[0]) notFound();
  const q = rowToQuestion(qRes.rows[0]);

  const aRes = await db.execute({
    sql: `SELECT a.id, a.content, a.isBest, a.adminReply, a.authorName, a.createdAt,
                 u.name AS authorUserName
          FROM Answer a LEFT JOIN User u ON u.id = a.authorId
          WHERE a.questionId = ? AND a.isPublic = 1
          ORDER BY a.isBest DESC, a.createdAt ASC`,
    args: [params.id],
  });
  const answers: AnswerRow[] = aRes.rows.map((r) => {
    const x = r as unknown as Record<string, unknown>;
    return {
      id: String(x.id),
      content: String(x.content),
      isBest: Boolean(x.isBest),
      adminReply: x.adminReply == null ? null : String(x.adminReply),
      authorName: x.authorName == null ? null : String(x.authorName),
      authorUserName: x.authorUserName == null ? null : String(x.authorUserName),
      createdAt: String(x.createdAt),
    };
  });

  const cat = getQaCategory(q.category);
  const isAdmin = session?.user?.role === "ADMIN";
  const canView = q.isPublic || isAdmin;

  if (!canView) {
    return (
      <div className="container-main py-16 text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-xl font-bold mb-2">该问题正在审核中或已下架</h1>
        <p className="text-gray-500 mb-6">内容通过人工审核后将公开展示</p>
        <Link href="/questions" className="btn-primary px-6 py-3">
          返回问答社区
        </Link>
      </div>
    );
  }

  return (
    <div className="container-main py-8 max-w-3xl">
      <QuestionViewTracker id={q.id} />

      <div className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-primary-600">
          首页
        </Link>
        <span className="mx-2">/</span>
        <Link href="/questions" className="hover:text-primary-600">
          问答社区
        </Link>
        {cat && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/questions?cat=${cat.key}`} className="hover:text-primary-600">
              {cat.name}
            </Link>
          </>
        )}
      </div>

      {/* 问题主体 */}
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {cat && (
            <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">
              {cat.icon} {cat.name}
            </span>
          )}
          {!q.isPublic && (
            <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
              {QUESTION_STATUS_LABEL[q.status] || q.status}
            </span>
          )}
          <span className="text-xs text-gray-400">{q.views} 浏览</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 leading-snug">{q.title}</h1>

        <div className="text-xs text-gray-400 mt-2">
          提问者：{q.authorName || "匿名"} · {new Date(q.createdAt).toLocaleDateString("zh-CN")}
        </div>

        <div className="mt-4 text-gray-700 whitespace-pre-wrap leading-relaxed">{q.content}</div>

        {q.adminReply && (
          <div className="mt-5 bg-primary-50 border border-primary-100 rounded-xl p-4">
            <div className="text-sm font-semibold text-primary-700 mb-1">📢 管理员回复</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{q.adminReply}</div>
          </div>
        )}
      </div>

      {/* 回复区 */}
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4">
          全部回复 <span className="text-gray-400 text-base ml-1">({answers.length})</span>
        </h2>

        {answers.length === 0 ? (
          <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border">
            还没有回复，欢迎来解答～
          </div>
        ) : (
          <div className="space-y-3">
            {answers.map((a) => (
              <div
                key={a.id}
                className={`bg-white rounded-2xl border p-5 ${
                  a.isBest ? "border-primary-300 bg-primary-50/30" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-800">
                    {a.authorName || a.authorUserName || "匿名用户"}
                  </span>
                  {a.isBest && (
                    <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full">
                      最佳回复
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    {new Date(a.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">{a.content}</div>
                {a.adminReply && (
                  <div className="mt-3 bg-gray-50 border rounded-lg p-3 text-sm text-gray-600 whitespace-pre-wrap">
                    📢 管理员：{a.adminReply}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 回复框 */}
      <div className="mt-8">
        {session?.user?.id ? (
          <AnswerForm questionId={q.id} />
        ) : (
          <div className="bg-white rounded-2xl border p-5 text-center text-gray-500">
            登录后参与回复 ·
            <Link href={`/auth/login?redirect=/questions/${q.id}`} className="text-primary-600 font-medium ml-1 hover:underline">
              去登录
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
