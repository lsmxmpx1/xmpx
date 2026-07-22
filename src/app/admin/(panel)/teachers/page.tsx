import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtDateTime } from "@/lib/format";
import { toggleTeacherStatus, deleteTeacher } from "../actions";

export const dynamic = "force-dynamic";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "展示中", cls: "bg-green-100 text-green-700" },
  INACTIVE: { label: "已下架", cls: "bg-gray-200 text-gray-600" },
};

export default async function AdminTeachers({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim();
  const teachers = await prisma.teacher.findMany({
    where: q
      ? { OR: [{ name: { contains: q } }, { title: { contains: q } }, { expertise: { contains: q } }] }
      : undefined,
    include: {
      currentInstitution: { select: { name: true } },
      _count: { select: { reviews: true, employments: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">老师管理</h2>
        <span className="text-sm text-gray-500">共 {teachers.length} 条</span>
      </div>

      <form className="mb-4 flex gap-2" method="get">
        <input name="q" defaultValue={q || ""} placeholder="按姓名/头衔/擅长搜索" className="input-field max-w-sm" />
        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm">搜索</button>
        {q && (
          <Link href="/admin/teachers" className="px-4 py-2 text-sm text-gray-500 hover:underline self-center">
            清除
          </Link>
        )}
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left p-3 font-medium">老师</th>
              <th className="text-left p-3 font-medium">当前机构</th>
              <th className="text-left p-3 font-medium">评分</th>
              <th className="text-left p-3 font-medium">评价/履历</th>
              <th className="text-left p-3 font-medium">状态</th>
              <th className="text-left p-3 font-medium">创建时间</th>
              <th className="text-left p-3 font-medium">最后修改</th>
              <th className="text-right p-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => {
              const st = STATUS_MAP[t.status] || { label: t.status, cls: "bg-gray-100 text-gray-500" };
              return (
                <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium text-gray-800">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.title || "-"}</div>
                  </td>
                  <td className="p-3 text-gray-600">{t.currentInstitution?.name || "-"}</td>
                  <td className="p-3 text-gray-600">
                    <span className="text-orange-400">★</span> {t.rating.toFixed(1)}
                  </td>
                  <td className="p-3 text-gray-600">{t._count.reviews} / {t._count.employments}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="p-3 text-gray-500 whitespace-nowrap">{fmtDateTime(t.createdAt)}</td>
                  <td className="p-3 text-gray-500 whitespace-nowrap">{fmtDateTime(t.updatedAt)}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2 flex-wrap">
                      <Link
                        href={`/teachers/${t.id}`}
                        target="_blank"
                        className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-100"
                      >
                        查看
                      </Link>
                      <form action={toggleTeacherStatus.bind(null, t.id)}>
                        <button className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-100">
                          {t.status === "ACTIVE" ? "下架" : "上架"}
                        </button>
                      </form>
                      <form action={deleteTeacher.bind(null, t.id)}>
                        <button className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50">删除</button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {teachers.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-400">暂无老师</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
