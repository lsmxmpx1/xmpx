import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtDateTime } from "@/lib/format";
import { deleteSchoolDirectory } from "./actions";
import SchoolForm from "./SchoolForm";

export const dynamic = "force-dynamic";

export default async function AdminSchoolDirectories({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim();
  const schools = await prisma.schoolDirectory.findMany({
    where: q ? { name: { contains: q } } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">学校名录（系统机构）</h2>
          <p className="text-xs text-gray-400 mt-1">
            由管理员后台录入的备案机构，独立于用户自主注册的培训机构；前台在「找机构」(/institutions) 列表与地图的「教育局备案机构」区块展示
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">共 {schools.length} 条</span>
          <SchoolForm />
        </div>
      </div>

      <form className="mb-4 flex gap-2" method="get">
        <input name="q" defaultValue={q || ""} placeholder="按学校名称搜索" className="input-field max-w-sm" />
        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm">搜索</button>
        {q && (
          <Link href="/admin/school-directories" className="px-4 py-2 text-sm text-gray-500 hover:underline self-center">
            清除
          </Link>
        )}
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left p-3 font-medium">学校名称</th>
              <th className="text-left p-3 font-medium">主管部门</th>
              <th className="text-left p-3 font-medium">区域</th>
              <th className="text-left p-3 font-medium">地址</th>
              <th className="text-left p-3 font-medium">创建时间</th>
              <th className="text-right p-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((s) => (
              <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-medium text-gray-800">{s.name}</div>
                  <div className="text-xs text-gray-400">许可证：{s.licenseNo || "-"}</div>
                </td>
                <td className="p-3 text-gray-600">{s.authority || "-"}</td>
                <td className="p-3 text-gray-600">{s.district || "-"}</td>
                <td className="p-3 text-gray-600 max-w-xs truncate">{s.address || "-"}</td>
                <td className="p-3 text-gray-500 whitespace-nowrap">{fmtDateTime(s.createdAt)}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2 flex-wrap">
                    <Link
                      href={`/schools/${s.id}`}
                      className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-100"
                    >
                      查看
                    </Link>
                    <form action={deleteSchoolDirectory.bind(null, s.id)}>
                      <button className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                        删除
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {schools.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">暂无机构</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
