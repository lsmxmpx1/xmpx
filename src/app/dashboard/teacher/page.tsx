import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import RoleSwitcher from "../RoleSwitcher";
import TeacherProfileForm from "./TeacherProfileForm";
import TeacherEmploymentManager from "./TeacherEmploymentManager";
import MyTeacherReviews from "./MyTeacherReviews";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "我的老师主页 | 厦门培训网",
};

export default async function TeacherDashboardPage() {
  const session = await auth();
  if (!session?.user) return redirect("/auth/login");

  const [teacher, institutions] = await Promise.all([
    prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        currentInstitution: { select: { id: true, name: true } },
        employments: {
          include: { institution: { select: { id: true, name: true } } },
          orderBy: { startDate: "desc" },
        },
        reviews: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.institution.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <RoleSwitcher current="TEACHER" />

      {!teacher ? (
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold">成为老师</h1>
            <p className="text-gray-500 mt-1">
              填写你的教学档案，即可在「找老师」栏目公开展示，让学员找到你
            </p>
          </div>
          <TeacherProfileForm mode="create" institutions={institutions} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="mb-2 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">我的老师主页</h1>
              <p className="text-gray-500 mt-1">
                维护档案、任职履历，查看学员对你的评价
              </p>
            </div>
            <a
              href={`/teachers/${teacher.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 shadow-sm whitespace-nowrap shrink-0"
            >
              👁 查看公开主页
            </a>
          </div>

          {/* 档案概览卡片 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              {teacher.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={teacher.avatar}
                  alt={teacher.name}
                  className="w-16 h-16 rounded-full object-cover border"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-600">
                  {teacher.name.slice(0, 1)}
                </div>
              )}
              <div>
                <div className="text-lg font-bold">{teacher.name}</div>
                <div className="text-sm text-gray-500">{teacher.title || "老师"}</div>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="text-orange-400">★ {teacher.rating.toFixed(1)}</span>
                  <span>{teacher.reviewCount} 条评价</span>
                </div>
              </div>
            </div>
          </div>

          {/* 编辑档案 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">编辑档案</h3>
            <TeacherProfileForm
              mode="edit"
              institutions={institutions}
              teacher={{
                name: teacher.name,
                title: teacher.title,
                bio: teacher.bio,
                expertise: teacher.expertise,
                avatar: teacher.avatar,
                district: teacher.district,
                currentInstitutionId: teacher.currentInstitutionId,
              }}
            />
          </div>

          {/* 任职履历 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">历史任职记录</h3>
            <TeacherEmploymentManager
              institutions={institutions}
              employments={teacher.employments.map((e) => ({
                id: e.id,
                institutionId: e.institutionId,
                institutionName: e.institution.name,
                title: e.title,
                startDate: e.startDate.toISOString(),
                endDate: e.endDate ? e.endDate.toISOString() : null,
              }))}
            />
          </div>

          {/* 我收到的评价 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">
              学员评价 <span className="text-gray-400 text-sm">({teacher.reviews.length})</span>
            </h3>
            <MyTeacherReviews
              reviews={teacher.reviews.map((r) => ({
                id: r.id,
                rating: r.rating,
                content: r.content,
                status: r.status,
                isPublic: r.isPublic,
                adminReply: r.adminReply,
                createdAt: r.createdAt.toISOString(),
                userName: r.user?.name || "匿名学员",
                userImage: r.user?.image || null,
              }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
