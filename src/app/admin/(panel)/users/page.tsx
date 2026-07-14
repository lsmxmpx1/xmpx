import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteUser, setUserRole } from "../actions";
import UserForm from "./UserForm";

export const dynamic = "force-dynamic";

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim();
  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q } },
            { name: { contains: q } },
            { phone: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">用户管理</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">共 {users.length} 条</span>
          <UserForm />
        </div>
      </div>

      <form className="mb-4 flex gap-2" method="get">
        <input name="q" defaultValue={q || ""} placeholder="按昵称/邮箱/手机搜索" className="input-field max-w-sm" />
        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm">搜索</button>
        {q && (
          <Link href="/admin/users" className="px-4 py-2 text-sm text-gray-500 hover:underline self-center">
            清除
          </Link>
        )}
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left p-3 font-medium">昵称</th>
              <th className="text-left p-3 font-medium">邮箱</th>
              <th className="text-left p-3 font-medium">手机</th>
              <th className="text-left p-3 font-medium">角色</th>
              <th className="text-right p-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-3 font-medium text-gray-800">{u.name || "-"}</td>
                <td className="p-3 text-gray-600">{u.email || "-"}</td>
                <td className="p-3 text-gray-600">{u.phone || "-"}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${u.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <UserForm
                      existing={{
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        phone: u.phone,
                        role: u.role,
                      }}
                    />
                    {u.role !== "ADMIN" ? (
                      <form action={setUserRole.bind(null, u.id, "ADMIN")}>
                        <button className="px-3 py-1 text-xs border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50">设为管理员</button>
                      </form>
                    ) : (
                      <form action={setUserRole.bind(null, u.id, "USER")}>
                        <button className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-100">取消管理员</button>
                      </form>
                    )}
                    <form action={deleteUser.bind(null, u.id)}>
                      <button className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50">删除</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">暂无用户</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
