import { prisma } from "@/lib/prisma";
import { updateFeedback, deleteFeedback } from "../actions";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  INSTITUTION: "机构问题",
  COURSE: "课程问题",
  OTHER: "其他问题",
};

const STATUS_OPTIONS = [
  { value: "PENDING", label: "待处理" },
  { value: "RESOLVED", label: "已处理" },
  { value: "TAKEDOWN", label: "已下架" },
  { value: "REJECTED", label: "已驳回" },
];

export default async function AdminFeedback() {
  const list = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">网站留言板</h2>
        <span className="text-sm text-gray-500">共 {list.length} 条</span>
      </div>

      <div className="space-y-4">
        {list.map((f) => (
          <div
            key={f.id}
            className={`bg-white rounded-xl shadow-sm border p-4 ${
              f.isPublic ? "border-gray-100" : "border-amber-200 bg-amber-50/30"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-800">
                {f.authorName || "匿名用户"}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                {TYPE_LABEL[f.type] ?? "其他问题"}
              </span>
              {f.targetName && (
                <span className="text-xs text-gray-500">关联：{f.targetName}</span>
              )}
              {!f.isPublic && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  前台隐藏
                </span>
              )}
              <span className="text-xs text-gray-400 ml-auto">
                {new Date(f.createdAt).toLocaleString("zh-CN")}
              </span>
            </div>

            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">
              {f.content}
            </p>

            <form action={updateFeedback.bind(null, f.id)} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">处理状态</label>
                  <select
                    name="status"
                    defaultValue={f.status}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      name="isPublic"
                      defaultChecked={f.isPublic}
                    />
                    在前台公开展示
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  处理结果 / 回复（将公开显示）
                </label>
                <textarea
                  name="adminReply"
                  rows={2}
                  defaultValue={f.adminReply || ""}
                  placeholder="如：经查实该机构存在违规宣传，已做下架处理。"
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  保存处理
                </button>
                <button
                  type="submit"
                  formAction={deleteFeedback.bind(null, f.id)}
                  className="px-4 py-1.5 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50"
                >
                  删除
                </button>
              </div>
            </form>
          </div>
        ))}

        {list.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
            暂无留言
          </div>
        )}
      </div>
    </div>
  );
}
