import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import TeacherReviewList from "@/components/TeacherReviewList";
import MessageButton from "@/components/MessageButton";
import { SITE_URL } from "@/lib/constants";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbLd } from "@/lib/seo";
import Faq from "@/components/seo/Faq";
import { getTeacherFaqs } from "@/lib/faq";

export const revalidate = 60; // ISR: 避免每次请求连远程 Turso 超时

function fmtDate(d: Date | null) {
  if (!d) return "至今";
  return new Date(d).toLocaleDateString("zh-CN", { year: "numeric", month: "short" });
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const teacher = await prisma.teacher.findUnique({
    where: { id: params.id },
    select: { name: true, title: true, bio: true, expertise: true, district: true },
  });
  if (!teacher) return { title: "老师未找到" };
  const desc =
    teacher.bio ||
    `${teacher.name}${teacher.title ? `，${teacher.title}` : ""}，擅长${teacher.expertise || "培训教学"}，厦门${teacher.district || ""}优质培训老师。`;
  return {
    title: `${teacher.name}${teacher.title ? ` - ${teacher.title}` : ""} - 厦门培训名师`,
    description: desc,
  };
}

export default async function TeacherDetailPage({ params }: { params: { id: string } }) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: params.id },
    include: {
      currentInstitution: { select: { id: true, name: true } },
      employments: {
        include: { institution: { select: { id: true, name: true } } },
        orderBy: { startDate: "desc" },
      },
    },
  });

  if (!teacher || teacher.status !== "ACTIVE") notFound();

  const session = await auth();
  const currentUserId = session?.user?.id;
  const isOwner = currentUserId === teacher.userId;
  const canReview = !!currentUserId && !isOwner;

  const expertiseTags = teacher.expertise
    ? teacher.expertise.split(/[,，]/).map((e) => e.trim()).filter(Boolean)
    : [];

  // 结构化数据：Person + 面包屑
  const teacherUrl = `${SITE_URL}/teachers/${teacher.id}`;
  const teacherLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: teacher.name,
    url: teacherUrl,
    ...(teacher.title ? { jobTitle: teacher.title } : {}),
    ...(teacher.avatar ? { image: teacher.avatar } : {}),
    ...(teacher.bio ? { description: teacher.bio } : {}),
    ...(teacher.district
      ? {
          address: {
            "@type": "PostalAddress",
            addressLocality: teacher.district,
            addressRegion: "福建省",
            addressCountry: "CN",
          },
        }
      : {}),
    ...(teacher.currentInstitution
      ? {
          affiliation: {
            "@type": "Organization",
            name: teacher.currentInstitution.name,
            url: `${SITE_URL}/institutions/${teacher.currentInstitution.id}`,
          },
        }
      : {}),
    ...(expertiseTags.length ? { knowsAbout: expertiseTags } : {}),
  };
  const teacherBreadcrumb = breadcrumbLd([
    { name: "首页", path: "/" },
    { name: "找老师", path: "/teachers" },
    { name: teacher.name, path: `/teachers/${teacher.id}` },
  ]);

  return (
    <div className="container-main py-8">
      <JsonLd data={[teacherLd, teacherBreadcrumb]} />
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">首页</Link>
        <span className="mx-2">/</span>
        <Link href="/teachers" className="hover:text-primary-600">找老师</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{teacher.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
            <div className="flex items-start gap-5">
              {teacher.avatar ? (
                <img
                  src={teacher.avatar}
                  alt={teacher.name}
                  className="w-22 h-22 rounded-full object-cover border shrink-0"
                />
              ) : (
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-3xl font-bold text-primary-600 shrink-0">
                  {teacher.name.slice(0, 1)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold">{teacher.name}</h1>
                  {isOwner && (
                    <Link href="/dashboard/teacher" className="text-sm text-primary-600 hover:underline">
                      编辑我的档案
                    </Link>
                  )}
                </div>
                {teacher.title && (
                  <div className="text-gray-500 mt-1">{teacher.title}</div>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1"><span className="text-orange-400">★</span> {teacher.rating.toFixed(1)}</span>
                  <span>{teacher.reviewCount} 条评价</span>
                  {teacher.district && <span>📍 {teacher.district}</span>}
                </div>
                {teacher.currentInstitution && (
                  <div className="mt-3 text-sm text-gray-600">
                    🏫 当前任职：
                    <Link
                      href={`/institutions/${teacher.currentInstitution.id}`}
                      className="text-primary-600 hover:underline"
                    >
                      {teacher.currentInstitution.name}
                    </Link>
                  </div>
                )}
                {!isOwner && currentUserId && (
                  <div className="mt-4">
                    <MessageButton
                      peerType="TEACHER"
                      peerId={teacher.id}
                      currentUserId={currentUserId}
                      isOwner={isOwner}
                      className="btn-primary px-6"
                    />
                  </div>
                )}
              </div>
            </div>

            {expertiseTags.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-bold text-gray-900 mb-3">擅长课程</h3>
                <div className="flex flex-wrap gap-2">
                  {expertiseTags.map((e, i) => (
                    <span key={i} className="px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-sm">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {teacher.bio && (
              <div className="mt-6 pt-6 border-t text-gray-600 leading-relaxed">
                <h3 className="font-bold text-gray-900 mb-2">个人简介</h3>
                <p className="whitespace-pre-line">{teacher.bio}</p>
              </div>
            )}
          </div>

          {/* 任职履历 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
            <h2 className="text-xl font-bold mb-6">任职履历</h2>
            {teacher.employments.length === 0 ? (
              <p className="text-gray-400">暂无履历记录</p>
            ) : (
              <ol className="relative border-l-2 border-gray-100 ml-2 space-y-6">
                {teacher.employments.map((emp) => (
                  <li key={emp.id} className="ml-6">
                    <span className="absolute -left-[9px] w-4 h-4 bg-primary-500 rounded-full border-2 border-white" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/institutions/${emp.institution.id}`}
                        className="font-semibold hover:text-primary-600"
                      >
                        {emp.institution.name}
                      </Link>
                      {emp.title && <span className="text-sm text-gray-500">· {emp.title}</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {fmtDate(emp.startDate)} ~ {fmtDate(emp.endDate)}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* 学员评价 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
            <h2 className="text-xl font-bold mb-6">学员评价</h2>
            {!currentUserId ? (
              <div className="mb-4 text-sm text-gray-500">
                <Link href="/auth/login" className="text-primary-600 hover:underline">登录</Link> 后即可评价这位老师。
              </div>
            ) : isOwner ? (
              <div className="mb-4 text-sm text-gray-400">这是您的档案，无法评价自己。</div>
            ) : null}
            <TeacherReviewList
              teacherId={teacher.id}
              currentUserId={currentUserId}
              canReview={canReview}
            />
          </div>

          <Faq items={getTeacherFaqs(teacher)} />
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border p-6 sticky top-24">
            <h3 className="font-bold mb-4">基本信息</h3>
            <div className="space-y-3 text-sm">
              {teacher.title && <div><span className="text-gray-400">头衔：</span><span className="font-medium">{teacher.title}</span></div>}
              {teacher.district && <div><span className="text-gray-400">区域：</span><span>{teacher.district}</span></div>}
              {teacher.currentInstitution && (
                <div>
                  <span className="text-gray-400">所在机构：</span>
                  <Link href={`/institutions/${teacher.currentInstitution.id}`} className="text-primary-600 hover:underline">
                    {teacher.currentInstitution.name}
                  </Link>
                </div>
              )}
              <div><span className="text-gray-400">评分：</span><span className="text-orange-400">★</span> {teacher.rating.toFixed(1)}（{teacher.reviewCount} 评价）</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
