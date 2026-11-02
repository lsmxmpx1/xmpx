import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import NextDynamic from "next/dynamic";
import { SITE_URL } from "@/lib/constants";
import type { MapPoint } from "@/components/map/AMapMap";

// ssr: false 避免高德 JS API 注入 <script> 导致 hydration mismatch
const AMapMap = NextDynamic(() => import("@/components/map/AMapMap").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-400" style={{ height: 360 }}>
      地图加载中…
    </div>
  ),
});

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const s = await prisma.schoolDirectory.findUnique({
    where: { id: params.id },
    select: { name: true, address: true },
  });
  if (!s) return { title: "机构未找到" };
  return {
    title: `${s.name} - 教育局备案机构`,
    description: s.address
      ? `${s.name}，地址：${s.address}。厦门教育主管部门备案机构信息。`
      : `${s.name} - 厦门教育局备案机构`,
    alternates: { canonical: `${SITE_URL}/schools/${params.id}` },
  };
}

export default async function SchoolDetailPage({ params }: { params: { id: string } }) {
  const school = await prisma.schoolDirectory.findUnique({ where: { id: params.id } });
  if (!school || school.status !== "PUBLISHED") notFound();

  const point: MapPoint | null =
    Number.isFinite(school.lng) && Number.isFinite(school.lat)
      ? {
          id: school.id,
          lng: Number(school.lng),
          lat: Number(school.lat),
          title: school.name,
          address: school.address || undefined,
        }
      : null;

  // 机构页面仅展示系统录入的 8 项备案字段（与用户注册机构页面相互独立）
  const fields: { label: string; value: string | null }[] = [
    { label: "学校名称", value: school.name },
    { label: "主管部门", value: school.authority },
    { label: "办学内容", value: school.educationalContent },
    { label: "办学许可证编号", value: school.licenseNo },
    { label: "举办者", value: school.organizer },
    { label: "学校地址", value: school.address },
    { label: "法定代表人", value: school.legalPerson },
    { label: "联系方式", value: school.contact },
  ];

  return (
    <div className="container-main py-8">
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">首页</Link>
        <span className="mx-2">/</span>
        <Link href="/institutions" className="hover:text-primary-600">找机构</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{school.name}</span>
      </div>

      {/* 备案信息卡 */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold">{school.name}</h1>
        <div className="text-sm text-gray-400 mt-1">
          {school.district || "厦门"} · 教育主管部门备案机构
        </div>

        <div className="mt-6 divide-y divide-gray-100">
          {fields.map((f) => (
            <div key={f.label} className="flex gap-4 py-3">
              <div className="w-32 shrink-0 text-sm text-gray-400">{f.label}</div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap break-all">
                {f.value || "-"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 学校地址地图（与机构详情「校区分布」一致的高德地图） */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8 mt-6">
        <h2 className="text-xl font-bold mb-4">学校地址</h2>
        {point ? (
          <AMapMap points={[point]} height={360} />
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
            暂未获取到该地址的地图坐标（可在后台补充更完整的地址后重新保存）。
          </div>
        )}
        {school.address && (
          <p className="text-sm text-gray-500 mt-3">📍 {school.address}</p>
        )}
      </div>
    </div>
  );
}
