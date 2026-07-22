import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtDateTime } from "@/lib/format";
import { toggleTeacherReviewPublic, replyTeacherReview, deleteTeacherReview } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminTeacherReviews({
  searchParams,
}: {
  searchParams: { q?: string; filter?: string };
}) {
  const q = searchParams.q?.trim();
  const filter = searchParams.filter;

  const where: any = {};
  if (filter === "hidden") where.isPublic = false;
  if (filter === "public") where.isPublic = true;
  if (q) {
    where.OR = [
      { content: { contains: q } },
      { teacher: { name: { contains: q } } },
      { user: { name: { contains: q } } },
    ];
  }

  const reviews = await prisma.teacherReview.findMany({
    where: Object.keys(where).length ? where : undefined,
    include: {
      teacher: { select: { id: true, name: true } },
      user: { select: { name: true, image: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const tabs = [
    { key: "", label: "全部" },
    { key: "public", label: "展示中" },
    { key: "hidden", label: "已下架" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">老师评价管理</h2>
        <span className="text-sm text-gray-500">共 {reviews.length} 条</span>
      </div>

      <div className="mb-4 flex items-center gap-2 flex-wrap">
        {tabs.map((t) => {
          const active = (filter || "") === t.key;
          const params = new URLSearchParams();
          if (t.key) params.set("filter", t.key);
          if (q) params.set("q", q);
          const href = `/admin/teacher-reviews${params.toString() ? `?${params.toString()}` : ""}`;
          return (
            <Link
              key={t.key}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                active ? "bg-slate-900 text-white" : "border text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
        <form className="ml-auto flex gap-2" method="get">
          {filter && <input type="hidden" name="filter" value={filter} />}
          <input name="q" defaultValue={q || ""} placeholder="按内容/老师/用户搜索" className="input-field max-w-xs" />
          <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm">搜索</button>
        </form>
      </div>

      <div className="space-y-3">
        {reviews.map((r) => (
          <div
            key={r.id}
            className={`bg-white rounded-xl shadow-sm border p-4 ${
              r.isPublic ? "border-gray-100" : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <Link
                    href={`/teachers/${r.teacher.id}`}
                    target="_blank"
                    className="font-medium text-gray-800 hover:underline"
                  >
                    {r.teacher.name}
                  </Link>
                  <span className="text-orange-400">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  <span className="text-gray-400">by {r.user?.name || "匿名"}</span>
                  {!r.isPublic && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">已下架</span>
                  )}
                  <span className="text-xs text-gray-300 ml-auto">
                    创建 {new Date(r.createdAt).toLocaleDateString("zh-CN")} · 修改 {fmtDateTime(r.updatedAt)}
                  </span>
                </div>
                {r.content && <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{r.content}</p>}
                {r.adminReply && (
                  <div className="mt-2 text-sm bg-blue-50 border border-blue-100 rounded-lg p-2 text-blue-800">
                    <span className="font-medium">管理员回复：</span>
                    {r.adminReply}
                  </div>
                )}

                <form action={replyTeacherReview.bind(null, r.id)} className="mt-3 flex gap-2">
                  <input
                    name="adminReply"
                    defaultValue={r.adminReply || ""}
                    placeholder="回复该评价（留空清除回复）"
                    className="input-field flex-1 text-sm"
                  />
                  <button className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-100 whitespace-nowrap">
                    保存回复
                  </button>
                </form>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <form action={toggleTeacherReviewPublic.bind(null, r.id)}>
                  <button className="w-full px-3 py-1 text-xs border rounded-lg hover:bg-gray-100">
                    {r.isPublic ? "下架" : "上架"}
                  </button>
                </form>
                <form action={deleteTeacherReview.bind(null, r.id)}>
                  <button className="w-full px-3 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                    删除
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="p-8 text-center text-gray-400 bg-white rounded-xl border border-gray-100">暂无评价</div>
        )}
      </div>
    </div>
  );
}
