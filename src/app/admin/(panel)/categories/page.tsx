import { prisma } from "@/lib/prisma";
import { fmtDateTime } from "@/lib/format";
import { deleteCategory } from "../actions";
import CategoryForm from "./CategoryForm";

export const dynamic = "force-dynamic";

export default async function AdminCategories() {
  const categories = await prisma.category.findMany({
    include: {
      parent: { select: { name: true } },
      _count: { select: { courses: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const catOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">分类管理</h2>
        <CategoryForm categories={catOptions} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left p-3 font-medium">名称</th>
              <th className="text-left p-3 font-medium">Slug</th>
              <th className="text-left p-3 font-medium">父级</th>
              <th className="text-left p-3 font-medium">课程数</th>
              <th className="text-left p-3 font-medium">创建时间</th>
              <th className="text-left p-3 font-medium">最后修改</th>
              <th className="text-right p-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => {
              const hasCourses = cat._count.courses > 0;
              return (
                <tr key={cat.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800">{cat.name}</td>
                  <td className="p-3 text-gray-500">{cat.slug}</td>
                  <td className="p-3 text-gray-600">{cat.parent?.name || "-"}</td>
                  <td className="p-3 text-gray-600">{cat._count.courses}</td>
                  <td className="p-3 text-gray-500 whitespace-nowrap">{fmtDateTime(cat.createdAt)}</td>
                  <td className="p-3 text-gray-500 whitespace-nowrap">{fmtDateTime(cat.updatedAt)}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <CategoryForm
                        categories={catOptions}
                        existing={{
                          id: cat.id,
                          name: cat.name,
                          slug: cat.slug,
                          parentId: cat.parentId,
                          icon: cat.icon,
                        }}
                      />
                      {hasCourses ? (
                        <span className="text-xs text-gray-400 px-3 py-1">有课程，不可删</span>
                      ) : (
                        <form action={deleteCategory.bind(null, cat.id)}>
                          <button className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                            删除
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {categories.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">暂无分类</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
