import Link from "next/link";
import { prisma } from "@/lib/prisma";
import FeedbackForm from "./FeedbackForm";

// ISR：公开列表每 60s 重新生成一次，避免每次请求都查远程库导致 Vercel 超时
export const revalidate = 60;

const TYPE_LABEL: Record<string, string> = {
  INSTITUTION: "机构问题",
  COURSE: "课程问题",
  OTHER: "其他问题",
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "待处理", cls: "bg-gray-100 text-gray-600" },
  RESOLVED: { label: "已处理", cls: "bg-green-100 text-green-700" },
  TAKEDOWN: { label: "已下架", cls: "bg-red-100 text-red-700" },
  REJECTED: { label: "已驳回", cls: "bg-orange-100 text-orange-700" },
};

export const metadata = {
  title: "网站留言板 | 厦门培训网",
  description: "反馈机构问题、课程问题或其他问题，违规内容将做下架处理，处理结果公开透明。",
};

export default async function FeedbackPage() {
  const list = await prisma.feedback.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="container-main py-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">网站留言板</h1>
      <p className="text-sm text-gray-500 mb-6">
        注册用户可反馈机构问题、课程问题或其他问题。针对违规内容，管理员将进行下架处理；
        所有留言内容及处理结果公开透明，匿名用户也可浏览。
      </p>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">提交反馈</h2>
        <FeedbackForm />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          公开留言（{list.length}）
        </h2>

        <div className="space-y-4">
          {list.map((f) => {
            const status = STATUS_META[f.status] ?? STATUS_META.PENDING;
            return (
              <div
                key={f.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-800">
                    {f.authorName || "匿名用户"}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                    {TYPE_LABEL[f.type] ?? "其他问题"}
                  </span>
                  {f.targetName && (
                    <span className="text-xs text-gray-500">
                      关联：{f.targetName}
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${status.cls}`}
                  >
                    {status.label}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {new Date(f.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {f.content}
                </p>
                {f.adminReply && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                    <span className="font-medium text-gray-700">管理员回复：</span>
                    {f.adminReply}
                  </div>
                )}
              </div>
            );
          })}

          {list.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
              暂无公开留言，欢迎成为第一个反馈者。
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 text-center text-xs text-gray-400">
        返回 <Link href="/" className="text-blue-600 hover:underline">网站首页</Link>
      </div>
    </div>
  );
}
