import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { DISTRICTS, formatPrice } from "@/lib/utils";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbLd } from "@/lib/seo";

export const revalidate = 60; // ISR: 静态预生成 + 按需再生成

export function generateStaticParams() {
  return DISTRICTS.map((district) => ({ district }));
}

export async function generateMetadata({ params }: { params: { district: string } }): Promise<Metadata> {
  const district = decodeURIComponent(params.district);
  if (!DISTRICTS.includes(district)) return { title: "区域未找到" };
  const title = `厦门${district}培训_课程与机构推荐 | ${SITE_NAME}`;
  const description = `厦门${district}优质教育培训机构与课程汇总，涵盖少儿、语言、职业技能等多品类，按区域就近选课，就上${SITE_NAME}。`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/courses/district/${encodeURIComponent(district)}` },
  };
}

export default async function DistrictCoursesPage({ params }: { params: { district: string } }) {
  const district = decodeURIComponent(params.district);
  if (!DISTRICTS.includes(district)) notFound();

  const [institutions, courses] = await Promise.all([
    prisma.institution.findMany({
      where: { district, status: "APPROVED" },
      include: { courses: { where: { status: "ACTIVE" }, include: { category: true }, take: 6 } },
      orderBy: { rating: "desc" },
      take: 24,
    }),
    prisma.course.findMany({
      where: { institution: { district, status: "APPROVED" }, status: "ACTIVE" },
      include: { institution: true, category: true },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
  ]);

  const districtPath = `/courses/district/${encodeURIComponent(district)}`;
  const breadcrumb = breadcrumbLd([
    { name: "首页", path: "/" },
    { name: "课程", path: "/courses" },
    { name: `厦门${district}培训`, path: districtPath },
  ]);

  return (
    <div className="container-main py-8">
      <JsonLd data={breadcrumb} />
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">首页</Link>
        <span className="mx-2">/</span>
        <Link href="/courses" className="hover:text-primary-600">课程</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">厦门{district}培训</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-3">厦门{district}培训</h1>
        <p className="text-gray-600 leading-relaxed">
          想在厦门{district}找培训机构或课程？这里汇总了{district}已认证的教育培训机构和热门课程，
          覆盖少儿培训、语言培训、职业技能、兴趣特长等多个品类。按区域就近选课，对比机构评分与学员评价，
          助你更快找到合适的培训班。
        </p>
      </div>

      {/* 机构列表 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-6">厦门{district}培训机构（{institutions.length}）</h2>
        {institutions.length === 0 ? (
          <p className="text-gray-400">该区域暂无已收录的机构，欢迎机构免费入驻。</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {institutions.map((inst) => (
              <Link key={inst.id} href={`/institutions/${inst.id}`} className="card p-5 group">
                <div className="flex items-center gap-3 mb-3">
                {inst.logo ? (
                  <img src={inst.logo} alt={inst.name} className="w-12 h-12 rounded-xl object-cover border" />
                  ) : (
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-lg font-bold text-primary-600 shrink-0">
                      {inst.name.slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold group-hover:text-primary-600 line-clamp-1">{inst.name}</h3>
                    <div className="text-xs text-gray-400 mt-0.5">
                      <span className="text-orange-400">★</span> {inst.rating.toFixed(1)} · {inst.courseCount} 门课程
                    </div>
                  </div>
                </div>
                {inst.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{inst.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 课程列表 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-6">厦门{district}热门课程（{courses.length}）</h2>
        {courses.length === 0 ? (
          <p className="text-gray-400">该区域暂无课程。</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {courses.map((c) => (
              <Link key={c.id} href={`/courses/${c.id}`} className="card group overflow-hidden">
                <div className="h-36 bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
                  {c.cover ? (
                    <img src={c.cover} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">📖</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm group-hover:text-primary-600 transition-colors line-clamp-2">{c.title}</h3>
                  <div className="text-xs text-gray-400 mt-1">{c.institution?.name}</div>
                  <div className="text-lg font-bold text-accent-600 mt-2">{formatPrice(c.price)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 其他区域 */}
      <section>
        <h2 className="text-lg font-bold mb-4">按区域浏览</h2>
        <div className="flex flex-wrap gap-2">
          {DISTRICTS.filter((d) => d !== district).map((d) => (
            <Link
              key={d}
              href={`/courses/district/${encodeURIComponent(d)}`}
              className="px-4 py-2 bg-white border rounded-full text-sm text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
            >
              厦门{d}培训
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
