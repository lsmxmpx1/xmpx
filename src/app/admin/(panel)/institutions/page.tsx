import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtDateTime } from "@/lib/format";
import {
  deleteInstitution,
  toggleInstitutionFeatured,
  approveInstitution,
  rejectInstitution,
} from "../actions";

export const dynamic = "force-dynamic";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "待审核", cls: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "已通过", cls: "bg-green-100 text-green-700" },
  REJECTED: { label: "已拒绝", cls: "bg-red-100 text-red-700" },
};

export default async function AdminInstitutions({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim();
  const institutions = await prisma.institution.findMany({
    where: q ? { name: { contains: q } } : undefined,
    include: { _count: { select: { courses: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">机构管理</h2>
        <span className="text-sm text-gray-500">共 {institutions.length} 条</span>
      </div>

      <form className="mb-4 flex gap-2" method="get">
        <input name="q" defaultValue={q || ""} placeholder="按机构名称搜索" className="input-field max-w-sm" />
        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm">搜索</button>
        {q && (
          <Link href="/admin/institutions" className="px-4 py-2 text-sm text-gray-500 hover:underline self-center">
            清除
          </Link>
        )}
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left p-3 font-medium">机构</th>
              <th className="text-left p-3 font-medium">区域</th>
              <th className="text-left p-3 font-medium">课程数</th>
              <th className="text-left p-3 font-medium">推荐</th>
              <th className="text-left p-3 font-medium">状态</th>
              <th className="text-left p-3 font-medium">创建时间</th>
              <th className="text-left p-3 font-medium">最后修改</th>
              <th className="text-right p-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {institutions.map((inst) => {
              const st = STATUS_MAP[inst.status] || { label: inst.status, cls: "bg-gray-100 text-gray-500" };
              return (
                <tr key={inst.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium text-gray-800">{inst.name}</div>
                    <div className="text-xs text-gray-400">{inst.district || "-"}</div>
                  </td>
                  <td className="p-3 text-gray-600">{inst.district || "-"}</td>
                  <td className="p-3 text-gray-600">{inst._count.courses}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${inst.featured ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>
                      {inst.featured ? "推荐" : "普通"}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="p-3 text-gray-500 whitespace-nowrap">{fmtDateTime(inst.createdAt)}</td>
                  <td className="p-3 text-gray-500 whitespace-nowrap">{fmtDateTime(inst.updatedAt)}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2 flex-wrap">
                      {inst.status !== "APPROVED" && (
                        <form action={approveInstitution.bind(null, inst.id)}>
                          <button className="px-3 py-1 text-xs border border-green-200 text-green-700 rounded-lg hover:bg-green-50">通过</button>
                        </form>
                      )}
                      {inst.status !== "REJECTED" && (
                        <form action={rejectInstitution.bind(null, inst.id)}>
                          <button className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50">拒绝</button>
                        </form>
                      )}
                      <form action={toggleInstitutionFeatured.bind(null, inst.id)}>
                        <button className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-100">
                          {inst.featured ? "取消推荐" : "推荐"}
                        </button>
                      </form>
                      <form action={deleteInstitution.bind(null, inst.id)}>
                        <button className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50">删除</button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {institutions.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-400">暂无机构</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
