import { prisma } from "@/lib/prisma";
import { fmtDateTime } from "@/lib/format";
import { deleteContact } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminContacts() {
  const contacts = await prisma.contact.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">联系留言</h2>
        <span className="text-sm text-gray-500">共 {contacts.length} 条（最近100）</span>
      </div>

      <div className="space-y-3">
        {contacts.map((c) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-medium text-gray-800">{c.name || "匿名"}</span>
                <span className="text-sm text-gray-500">{c.phone}</span>
                <span className="text-xs text-gray-400">
                  创建：{fmtDateTime(c.createdAt)} · 修改：{fmtDateTime(c.updatedAt)}
                </span>
              </div>
              <p className="text-sm text-gray-600">{c.message || "（无留言内容）"}</p>
            </div>
            <form action={deleteContact.bind(null, c.id)}>
              <button className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 shrink-0">
                删除
              </button>
            </form>
          </div>
        ))}
        {contacts.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
            暂无留言
          </div>
        )}
      </div>
    </div>
  );
}
