import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getStats() {
  const [
    courses,
    institutions,
    pendingInstitutions,
    categories,
    users,
    articles,
    publishedArticles,
    contacts,
    reviews,
    ads,
  ] = await Promise.all([
    prisma.course.count(),
    prisma.institution.count(),
    prisma.institution.count({ where: { status: "PENDING" } }),
    prisma.category.count(),
    prisma.user.count(),
    prisma.article.count(),
    prisma.article.count({ where: { published: true } }),
    prisma.contact.count(),
    prisma.review.count(),
    prisma.advertisement.count(),
  ]);
  return {
    courses,
    institutions,
    pendingInstitutions,
    categories,
    users,
    articles,
    publishedArticles,
    contacts,
    reviews,
    ads,
  };
}

type StatKey = keyof Awaited<ReturnType<typeof getStats>>;

type Card = {
  key: StatKey;
  label: string;
  href: string;
  color: string;
  badgeKey?: StatKey;
};

const CARDS: Card[] = [
  { key: "courses", label: "课程总数", href: "/admin/courses", color: "bg-blue-500" },
  { key: "institutions", label: "入驻机构", href: "/admin/institutions", color: "bg-emerald-500", badgeKey: "pendingInstitutions" },
  { key: "categories", label: "分类数量", href: "/admin/categories", color: "bg-purple-500" },
  { key: "users", label: "注册用户", href: "/admin/users", color: "bg-amber-500" },
  { key: "articles", label: "文章（已发布）", href: "/admin/articles", color: "bg-rose-500" },
  { key: "contacts", label: "咨询留言", href: "/admin/contacts", color: "bg-cyan-500" },
  { key: "reviews", label: "用户评价", href: "#", color: "bg-indigo-500" },
  { key: "ads", label: "广告位", href: "/admin/ads", color: "bg-orange-500" },
];

export default async function AdminHome() {
  const s = await getStats();

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">概览</h2>
      <p className="text-gray-500 text-sm mb-6">网站核心数据总览</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CARDS.map((c) => {
          let value: string | number;
          if (c.key === "articles") {
            value = `${s.publishedArticles}/${s.articles}`;
          } else if (c.badgeKey && (s as Record<string, number>)[c.badgeKey] > 0) {
            // Show total + pending count for institutions
            value = `${s[c.key]} (${s[c.badgeKey]} 待审核)`;
          } else {
            value = (s as Record<string, number | string>)[c.key] as string | number;
          }
          const inner = (
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition">
              <div className={`w-10 h-10 rounded-lg ${c.color} mb-3`} />
              <div className="text-2xl font-bold text-gray-800">{value}</div>
              <div className="text-sm text-gray-500 mt-1">{c.label}</div>
            </div>
          );
          return c.href === "#" ? (
            <div key={c.key}>{inner}</div>
          ) : (
            <Link key={c.key} href={c.href}>
              {inner}
            </Link>
          );
        })}
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 mb-2">快捷操作</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/settings"
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800"
          >
            配置短信网关
          </Link>
          {s.pendingInstitutions > 0 && (
            <Link
              href="/admin/institutions"
              className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm hover:bg-red-100 font-medium"
            >
              审核入驻机构（{s.pendingInstitutions} 待审核）
            </Link>
          )}
          {s.pendingInstitutions === 0 && (
            <Link
              href="/admin/institutions"
              className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50"
            >
              审核入驻机构
            </Link>
          )}
          <Link
            href="/admin/courses"
            className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50"
          >
            管理课程
          </Link>
        </div>
      </div>
    </div>
  );
}
