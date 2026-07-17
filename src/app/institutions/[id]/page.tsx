import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";
import ContactButton from "@/components/ContactButton";
import FavoriteButton from "@/components/FavoriteButton";
import ReviewList from "@/components/ReviewList";

export const revalidate = 60; // ISR: 避免每次请求连远程 Turso 超时

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const inst = await prisma.institution.findUnique({
    where: { id: params.id },
    select: { name: true, description: true, district: true },
  });
  if (!inst) return { title: "机构未找到" };
  return {
    title: `${inst.name} - ${inst.district || "厦门"}培训机构`,
    description: inst.description || `${inst.name}，厦门${inst.district || ""}优质培训机构，查看课程、评分、学员评价`,
  };
}

export default async function InstitutionDetailPage({ params }: { params: { id: string } }) {
  const institution = await prisma.institution.findUnique({
    where: { id: params.id },
    include: {
      courses: { where: { status: "ACTIVE" }, include: { category: true }, take: 10 },
    },
  });

  if (!institution) notFound();

  // Check if current user favorited this institution
  const session = await auth();
  let isFavorited = false;
  let currentUserId: string | undefined;
  if (session?.user) {
    currentUserId = session.user.id;
    const fav = await prisma.favorite.findFirst({
      where: { userId: currentUserId, institutionId: institution.id },
    });
    isFavorited = !!fav;
  }

  // Parse store images
  const storeImages = institution.images
    ? institution.images.split(",").filter(Boolean)
    : [];

  return (
    <div className="container-main py-8">
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">首页</Link>
        <span className="mx-2">/</span>
        <Link href="/institutions" className="hover:text-primary-600">机构</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{institution.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-8">
          {/* Cover image */}
          {institution.cover && (
            <div className="rounded-2xl overflow-hidden shadow-sm h-48 md:h-64 relative">
              <Image
                src={institution.cover}
                alt={institution.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 66vw"
              />
            </div>
          )}

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
            <div className="flex items-start gap-5">
              {institution.logo ? (
                <Image
                  src={institution.logo}
                  alt={institution.name}
                  width={80}
                  height={80}
                  className="rounded-2xl object-cover border shrink-0"
                />
              ) : (
                <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center text-3xl font-bold text-primary-600 shrink-0">
                  {institution.name.slice(0, 2)}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{institution.name}</h1>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{institution.district}</span>
                      <span className="flex items-center gap-1"><span className="text-orange-400">★</span> {institution.rating.toFixed(1)}</span>
                      <span>{institution.reviewCount} 条评价</span>
                      <span>{institution.courseCount} 门课程</span>
                    </div>
                    {institution.phone && (
                      <div className="mt-3 text-sm text-gray-500">📞 {institution.phone}</div>
                    )}
                  </div>
                  <FavoriteButton
                    institutionId={institution.id}
                    initialFavorited={isFavorited}
                    variant="icon"
                  />
                </div>
              </div>
            </div>

            {institution.description && (
              <div className="mt-6 pt-6 border-t text-gray-600 leading-relaxed">
                <h3 className="font-bold text-gray-900 mb-2">机构简介</h3>
                <p>{institution.description}</p>
              </div>
            )}

            <div className="mt-6 flex gap-3 flex-wrap">
              <ContactButton
                institutionId={institution.id}
                institutionName={institution.name}
                phone={institution.phone ?? undefined}
                label="立即咨询"
              />
              <FavoriteButton
                institutionId={institution.id}
                initialFavorited={isFavorited}
              />
            </div>
          </div>

          {/* Store Images Gallery */}
          {storeImages.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4">门店环境</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {storeImages.map((img, idx) => (
                  <div key={idx} className="aspect-video rounded-xl overflow-hidden border relative">
                    <Image
                      src={img}
                      alt={`${institution.name} 门店图 ${idx + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Courses */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
            <h2 className="text-xl font-bold mb-6">开设课程</h2>
            {institution.courses.length === 0 ? (
              <p className="text-gray-400">暂无课程</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {institution.courses.map((course) => (
                  <Link key={course.id} href={`/courses/${course.id}`} className="flex gap-4 p-4 border rounded-xl hover:border-primary-300 hover:shadow-sm transition-all group">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-primary-50 shrink-0 flex items-center justify-center relative">
                      {course.cover ? (
                        <Image src={course.cover} alt={course.title} fill className="object-cover" sizes="64px" />
                      ) : (
                        <span className="text-2xl">📖</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm group-hover:text-primary-600 line-clamp-2">{course.title}</h4>
                      <div className="text-xs text-gray-400 mt-1">{course.category?.name}</div>
                      <div className="text-base font-bold text-accent-600 mt-1">{formatPrice(course.price)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
            <h2 className="text-xl font-bold mb-6">学员评价</h2>
            <ReviewList
              institutionId={institution.id}
              currentUserId={currentUserId}
            />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border p-6 sticky top-24">
            <h3 className="font-bold mb-4">联系方式</h3>
            <div className="space-y-3 text-sm">
              {institution.phone && <div><span className="text-gray-400">电话：</span><span className="font-medium">{institution.phone}</span></div>}
              {institution.website && <div><span className="text-gray-400">网站：</span><a href={institution.website} target="_blank" rel="noopener noreferrer" className="text-primary-600">{institution.website}</a></div>}
              {institution.address && <div><span className="text-gray-400">地址：</span><span>{institution.address}</span></div>}
              <div><span className="text-gray-400">区域：</span><span>{institution.district}</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
