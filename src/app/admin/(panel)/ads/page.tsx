import { prisma } from "@/lib/prisma";
import { deleteAd, toggleAdActive, toggleAdPlanActive } from "../actions";
import AdForm from "./AdForm";
import AdPlanForm from "./AdPlanForm";
import AdPlanDelete from "./AdPlanDelete";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

export default async function AdminAds() {
  const ads = await prisma.advertisement.findMany({
    include: { institution: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  const plans = await prisma.adPlan.findMany({ orderBy: { sortOrder: "asc" } });
  const institutions = await prisma.institution.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const instOptions = institutions.map((i) => ({ id: i.id, name: i.name }));

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">广告位管理</h2>
          <AdForm institutions={instOptions} />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left p-3 font-medium">标题</th>
                <th className="text-left p-3 font-medium">位置</th>
                <th className="text-left p-3 font-medium">所属机构</th>
                <th className="text-left p-3 font-medium">状态</th>
                <th className="text-right p-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((ad) => (
                <tr key={ad.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800">{ad.title}</td>
                  <td className="p-3 text-gray-600">{ad.position}</td>
                  <td className="p-3 text-gray-600">{ad.institution?.name || "平台"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${ad.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {ad.active ? "展示中" : "已暂停"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <AdForm
                        institutions={instOptions}
                        existing={{
                          id: ad.id,
                          title: ad.title,
                          position: ad.position,
                          institutionId: ad.institutionId,
                          image: ad.image,
                          link: ad.link,
                          active: ad.active,
                          startDate: fmtDate(ad.startDate),
                          endDate: fmtDate(ad.endDate),
                        }}
                      />
                      <form action={toggleAdActive.bind(null, ad.id)}>
                        <button className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-100">
                          {ad.active ? "暂停" : "展示"}
                        </button>
                      </form>
                      <form action={deleteAd.bind(null, ad.id)}>
                        <button className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50">删除</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {ads.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">暂无广告</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">广告套餐</h2>
          <AdPlanForm />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left p-3 font-medium">套餐</th>
                <th className="text-left p-3 font-medium">等级</th>
                <th className="text-left p-3 font-medium">价格</th>
                <th className="text-left p-3 font-medium">时长(天)</th>
                <th className="text-left p-3 font-medium">功能特性</th>
                <th className="text-left p-3 font-medium">排序</th>
                <th className="text-left p-3 font-medium">状态</th>
                <th className="text-right p-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800">{p.name}</td>
                  <td className="p-3 text-gray-600">{p.level}</td>
                  <td className="p-3 text-gray-600">¥{p.price}</td>
                  <td className="p-3 text-gray-600">{p.duration}</td>
                  <td className="p-3 text-gray-500 max-w-xs truncate" title={p.features}>{p.features}</td>
                  <td className="p-3 text-gray-600">{p.sortOrder}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.active ? "启用" : "停用"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <AdPlanForm
                        existing={{
                          id: p.id,
                          name: p.name,
                          level: p.level,
                          price: p.price,
                          duration: p.duration,
                          features: p.features,
                          description: p.description,
                          active: p.active,
                          sortOrder: p.sortOrder,
                        }}
                      />
                      <form action={toggleAdPlanActive.bind(null, p.id)}>
                        <button className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-100">
                          {p.active ? "停用" : "启用"}
                        </button>
                      </form>
                      <AdPlanDelete id={p.id} />
                    </div>
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">暂无套餐</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
