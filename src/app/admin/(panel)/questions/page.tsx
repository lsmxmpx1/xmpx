import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDateTime } from "@/lib/format";
import { QA_CATEGORIES, getQaCategory, QUESTION_STATUS_LABEL } from "@/lib/qa";
import {
  approveQuestion,
  rejectQuestion,
  toggleQuestionPublic,
  replyQuestion,
  deleteQuestion,
  approveAnswer,
  rejectAnswer,
  toggleAnswerBest,
  deleteAnswer,
} from "../actions";
import ConfirmForm from "../ConfirmForm";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待审核" },
  { key: "public", label: "已公开" },
  { key: "hidden", label: "未公开" },
];

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/admin/login");

  const filter = searchParams.filter || "all";
  const where =
    filter === "pending"
      ? { status: "PENDING" }
      : filter === "public"
        ? { isPublic: true }
        : filter === "hidden"
          ? { isPublic: false }
          : {};

  const questions = await prisma.question.findMany({
    where,
    include: {
      author: { select: { name: true } },
      answers: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">问答管理（人工审核防广告）</h1>
        <Link href="/questions" className="text-primary-600 text-sm hover:underline">
          查看前台 →
        </Link>
      </div>

      {/* 筛选 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/questions?filter=${f.key}`}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === f.key
                ? "bg-primary-600 text-white"
                : "bg-white text-gray-600 border hover:bg-primary-50"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {questions.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-xl border">暂无提问</div>
      ) : (
        <div className="space-y-6">
          {questions.map((q) => {
            const cat = getQaCategory(q.category);
            return (
              <div key={q.id} className="bg-white rounded-xl border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {cat && (
                        <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">
                          {cat.icon} {cat.name}
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          q.isPublic
                            ? "bg-green-50 text-green-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {q.isPublic ? "已公开" : QUESTION_STATUS_LABEL[q.status] || q.status}
                      </span>
                    </div>
                    <Link
                      href={`/questions/${q.id}`}
                      className="font-semibold text-gray-900 hover:text-primary-600"
                    >
                      {q.title}
                    </Link>
                    <div className="text-xs text-gray-400 mt-1">
                      {q.author?.name || "匿名"} · 创建 {fmtDateTime(q.createdAt)} · 修改 {fmtDateTime(q.updatedAt)} ·{" "}
                      {q.views} 浏览 · {q.answers.length} 回复
                    </div>
                  </div>

                  {/* 问题级操作 */}
                  <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                    {!q.isPublic && (
                      <form action={approveQuestion.bind(null, q.id)}>
                        <button className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">
                          通过
                        </button>
                      </form>
                    )}
                    {q.status !== "REJECTED" && q.isPublic && (
                      <form action={rejectQuestion.bind(null, q.id)}>
                        <button className="px-3 py-1.5 text-xs bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                          驳回
                        </button>
                      </form>
                    )}
                    <form action={toggleQuestionPublic.bind(null, q.id)}>
                      <button className="px-3 py-1.5 text-xs bg-white border rounded-lg hover:bg-gray-50">
                        {q.isPublic ? "下架" : "上架"}
                      </button>
                    </form>
                    <ConfirmForm
                      action={deleteQuestion.bind(null, q.id)}
                      confirmText="确认删除该提问及其全部回复？"
                      buttonText="删除"
                      buttonClassName="px-3 py-1.5 text-xs bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100"
                    />
                  </div>
                </div>

                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{q.content}</p>

                {/* 管理员回复 */}
                <form action={replyQuestion.bind(null, q.id)} className="flex gap-2 mt-3">
                  <input
                    name="adminReply"
                    defaultValue={q.adminReply || ""}
                    placeholder="管理员回复（公开可见）"
                    className="flex-1 px-3 py-2 text-sm border rounded-lg"
                  />
                  <button className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    保存回复
                  </button>
                </form>

                {/* 回复列表 */}
                {q.answers.length > 0 && (
                  <div className="mt-4 space-y-2 border-t pt-3">
                    <div className="text-xs font-semibold text-gray-500">回复（{q.answers.length}）</div>
                    {q.answers.map((a) => (
                      <div key={a.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm">
                            <span className="font-medium text-gray-800">
                              {a.authorName || a.author?.name || "匿名"}
                            </span>
                            {a.isBest && (
                              <span className="ml-2 text-xs bg-primary-600 text-white px-1.5 py-0.5 rounded-full">
                                最佳
                              </span>
                            )}
                            <span className="ml-2 text-xs text-gray-400">
                              {a.isPublic ? "已公开" : a.status}
                            </span>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            {!a.isPublic && (
                              <form action={approveAnswer.bind(null, a.id)}>
                                <button className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">
                                  通过
                                </button>
                              </form>
                            )}
                            {a.isPublic && (
                              <form action={rejectAnswer.bind(null, a.id)}>
                                <button className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500">
                                  驳回
                                </button>
                              </form>
                            )}
                            <form action={toggleAnswerBest.bind(null, a.id)}>
                              <button className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-100">
                                {a.isBest ? "取消最佳" : "最佳"}
                              </button>
                            </form>
                            <ConfirmForm
                              action={deleteAnswer.bind(null, a.id)}
                              confirmText="确认删除该回复？"
                              buttonText="删"
                              buttonClassName="px-2 py-1 text-xs bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100"
                            />
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{a.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
