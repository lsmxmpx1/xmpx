import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteCourse, toggleCourseStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminCourses({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim();
  const courses = await prisma.course.findMany({
    where: q ? { title: { contains: q } } : undefined,
    include: {
      institution: { select: { name: true } },
      category: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">课程管理</h2>
        <span className="text-sm text-gray-500">共 {courses.length} 条（最多显示100）</span>
      </div>

      <form className="mb-4 flex gap-2" method="get">
        <input
          name="q"
          defaultValue={q || ""}
          placeholder="按课程标题搜索"
          className="input-field max-w-sm"
        />
        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm">搜索</button>
        {q && (
          <Link href="/admin/courses" className="px-4 py-2 text-sm text-gray-500 hover:underline self-center">
            清除
          </Link>
        )}
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left p-3 font-medium">课程</th>
              <th className="text-left p-3 font-medium">机构</th>
              <th className="text-left p-3 font-medium">分类</th>
              <th className="text-left p-3 font-medium">价格</th>
              <th className="text-left p-3 font-medium">状态</th>
              <th className="text-right p-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-medium text-gray-800 line-clamp-1">{c.title}</div>
                  <div className="text-xs text-gray-400">ID: {c.id.slice(0, 8)}</div>
                </td>
                <td className="p-3 text-gray-600">{c.institution?.name || "-"}</td>
                <td className="p-3 text-gray-600">{c.category?.name || "-"}</td>
                <td className="p-3 text-gray-600">¥{c.price || "0"}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${c.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.status === "ACTIVE" ? "已上架" : "已下架"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <form action={toggleCourseStatus.bind(null, c.id)}>
                      <button className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-100">
                        {c.status === "ACTIVE" ? "下架" : "上架"}
                      </button>
                    </form>
                    <form action={deleteCourse.bind(null, c.id)}>
                      <button className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                        删除
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">暂无课程</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
