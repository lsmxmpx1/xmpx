import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "我是老师 - 展示专业实力 | 厦门培训网",
  description:
    "培训老师入驻厦门培训网，建立个人专业主页、展示教学履历、收获学员评价。让更多学员认可你的专业能力！",
};

const FEATURES = [
  {
    title: "个人专业主页",
    desc: "拥有专属老师主页，展示姓名、职称、擅长领域、教学经历，打造个人品牌。",
    icon: "👨‍🏫",
  },
  {
    title: "任职履历展示",
    desc: "关联任职机构与任教课程，让学员全面了解你的教学背景和专业资质。",
    icon: "📋",
  },
  {
    title: "学员真实评价",
    desc: "上过课的学员可以为你打分和写评价，好评积累让你的口碑持续发酵。",
    icon: "⭐",
  },
  {
    title: "私信沟通",
    desc: "学员可通过平台直接私信咨询课程详情，高效对接潜在学员。",
    icon: "💬",
  },
];

const STEPS = [
  { num: "1", title: "注册账号", desc: "填写基本信息，快速完成注册" },
  { num: "2", title: "成为老师", desc: "在用户中心选择「成为老师」，填写姓名、职称、擅长领域" },
  { num: "3", title: "完善资料", desc: "上传头像、补充教学履历、关联任职机构（可选）" },
  { num: "4", title: "被学员发现", desc: "你的主页会出现在「找老师」频道，学员可查看并联系你" },
];

const FAQS = [
  { q: "个人老师可以入驻吗？", a: "可以。无论您是否隶属于培训机构，都可以以「独立老师」身份入驻，展示个人专业能力。" },
  { q: "需要付费吗？", a: "完全免费。注册、开通老师身份、维护主页均不收取任何费用。" },
  { q: "老师和机构有什么区别？", a: "机构可以发布课程和接收咨询线索；老师侧重于个人品牌展示和学员互动。很多老师同时既是机构成员又开通了老师身份。" },
  { q: "如何提高曝光？", a: "完善个人信息、积累学员评价、保持活跃回复咨询。好评多的老师会在「找老师」页面优先展示。" },
];

export default function GuideTeacherPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-accent-500 via-accent-600 to-accent-700 text-white py-20 md:py-28">
        <div className="container-main max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 bg-white/15 rounded-full text-sm font-medium mb-6 backdrop-blur">
            打造个人品牌 · 被学员看见
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-6">
            我是老师
            <br />
            <span className="text-accent-200">展示你的专业实力</span>
          </h1>
          <p className="text-lg md:text-xl text-accent-100 mb-10 max-w-2xl mx-auto">
            在厦门培训网建立你的专属教师主页，展示教学履历与专业特长，
            让找培训的学员一眼认出你的价值。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register?role=teacher"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-accent-600 font-bold text-lg rounded-xl hover:bg-accent-50 transition-colors shadow-lg shadow-black/20"
            >
              立即开通老师主页
            </Link>
            <Link
              href="/teachers"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-bold text-lg rounded-xl hover:bg-white/20 transition-colors border border-white/20"
            >
              查看已入驻老师 →
            </Link>
          </div>

          {/* 双图预览：后台 + 公开页 */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl overflow-hidden shadow-2xl shadow-black/30 border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/guide/teacher-dashboard.png"
              alt="老师后台管理界面"
              className="w-full"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/guide/teacher-public.png"
              alt="老师公开主页示例"
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* ── 功能介绍 ── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-main max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              老师身份四大核心权益
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              从个人展示到学员互动，全方位打造你的教师影响力
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-gray-50 rounded-2xl p-6 text-center hover:bg-accent-50 hover:shadow-lg transition-all duration-300 border border-transparent hover:border-accent-200 group"
              >
                <span className="text-4xl mb-4 block">{f.icon}</span>
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-accent-600">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 后台截图详览 ── */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container-main max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4">
            你的老师后台长这样
          </h2>
          <p className="text-gray-500 text-center mb-10 text-lg">
            直观的管理界面，轻松维护你的教师资料
          </p>

          <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/guide/teacher-dashboard.png"
              alt="老师后台完整界面截图"
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* ── 开通步骤 ── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-main max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4">
            四步开通老师身份
          </h2>
          <p className="text-gray-500 text-center mb-12 text-lg">
            简单快捷，几分钟即可拥有专属教师主页
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div key={s.num} className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent-500 text-white font-bold text-lg mb-4">
                  {s.num}
                </span>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                {s.num !== "4" && (
                  <span className="hidden lg:block absolute -right-3 top-10 text-gray-300 text-2xl">→</span>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/auth/register?role=teacher"
              className="inline-flex items-center px-8 py-4 bg-accent-500 text-white font-bold text-lg rounded-xl hover:bg-accent-600 transition-colors shadow-lg shadow-accent-500/25"
            >
              开始第一步：免费注册 →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container-main max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
            常见问题
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-gray-200 overflow-hidden"
              >
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer bg-white hover:bg-gray-50 transition-colors font-medium text-gray-900">
                  {faq.q}
                  <svg
                    className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 py-4 text-gray-600 text-sm leading-relaxed bg-white border-t border-gray-100">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── 底部 CTA ── */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-accent-500 to-accent-600 text-white">
        <div className="container-main max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            让学员找到好老师，也让你被学员找到
          </h2>
          <p className="text-accent-100 text-lg mb-8">
            立即开通老师身份，开启你的个人品牌之路
          </p>
          <Link
            href="/auth/register?role=teacher"
            className="inline-flex items-center px-10 py-4 bg-white text-accent-600 font-bold text-lg rounded-xl hover:bg-accent-50 transition-colors shadow-lg"
          >
            免费开通老师主页
          </Link>
        </div>
      </section>
    </>
  );
}
