import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "我是机构 - 免费入驻厦门培训网 | 厦门培训网",
    description:
      "培训机构免费入驻厦门培训网，发布课程、接收咨询线索、提升品牌曝光。立即开通您的机构主页！",
};

const FEATURES = [
  {
    title: "课程管理",
    desc: "轻松发布和管理培训课程，支持多校区、多分类，学员一键报名咨询。",
    img: "/guide/org-courses.png",
    alt: "机构后台 - 课程管理界面",
  },
  {
    title: "咨询线索",
    desc: "主动接收学员咨询和报名意向，不错过任何一个潜在客户，转化率翻倍。",
    img: "/guide/org-contacts.png",
    alt: "机构后台 - 咨询线索界面",
  },
  {
    title: "推广中心",
    desc: "购买广告位和推荐曝光，让您的机构和课程出现在首页黄金位置。",
    img: "/guide/org-ad.png",
    alt: "机构后台 - 推广中心界面",
  },
  {
    title: "数据概览",
    desc: "实时查看课程浏览量、咨询数、评价评分等核心数据，运营一目了然。",
    img: "/guide/org-overview.png",
    alt: "机构后台 - 数据概览界面",
  },
];

const STEPS = [
  { num: "1", title: "免费注册", desc: "填写基本信息，30秒完成账号注册" },
  { num: "2", title: "开通机构", desc: "在用户中心选择「成为机构」，填写机构名称、地址、联系方式" },
  { num: "3", title: "发布课程", desc: "上传课程信息、设置价格、添加校区地址" },
  { num: "4", title: "接收咨询", desc: "学员通过平台发起咨询，您可在后台及时回复并转化成交" },
];

const FAQS = [
  { q: "入驻收费吗？", a: "完全免费。注册账号、开通机构、发布课程、接收咨询线索均不收取任何费用。" },
  { q: "审核需要多久？", a: "机构信息提交后通常 1 个工作日内完成审核，审核通过后即可正常使用全部功能。" },
  { q: "可以发布多少门课程？", a: "不限数量。您可以发布任意数量的课程，支持按分类、校区、价格灵活管理。" },
  { q: "咨询线索怎么获取？", a: "学员在课程详情页或机构主页点击「咨询」按钮即可向您发送咨询，您会在后台收到通知。" },
];

export default function GuideInstitutionPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-20 md:py-28">
        <div className="container-main max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 bg-white/15 rounded-full text-sm font-medium mb-6 backdrop-blur">
            免费入驻 · 零门槛开通
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-6">
            我是机构
            <br />
            <span className="text-primary-200">让更多学员找到你的培训课程</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            本网站在百度、Bing 等搜索引擎中搜索"厦门培训网"排名第一，自带天然流量。
            入驻后即可发布课程、接收咨询线索、提升品牌曝光。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register?role=institution"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-700 font-bold text-lg rounded-xl hover:bg-primary-50 transition-colors shadow-lg shadow-black/20"
            >
              立即免费入驻
            </Link>
            <Link
              href="/institutions"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-bold text-lg rounded-xl hover:bg-white/20 transition-colors border border-white/20"
            >
              查看已入驻机构 →
            </Link>
          </div>

          {/* 机构公开页预览 */}
          <div className="mt-14 rounded-2xl overflow-hidden shadow-2xl shadow-black/30 border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/guide/org-public.png"
              alt="机构公开主页示例 - 厦门优学教育"
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* ── 为什么入驻 ── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-main max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              一站式机构运营工具箱
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              从发布课程到转化成交，我们提供完整的线上运营能力
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-gray-200 overflow-hidden hover:border-primary-300 hover:shadow-xl transition-all duration-300"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.img}
                  alt={f.alt}
                  className="w-full h-56 object-cover object-top border-b border-gray-100 group-hover:scale-[1.01] transition-transform duration-500"
                />
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 入驻步骤 ── */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container-main max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4">
            四步完成入驻
          </h2>
          <p className="text-gray-500 text-center mb-12 text-lg">
            简单四步，即可开启您的线上招生通道
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div key={s.num} className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-600 text-white font-bold text-lg mb-4">
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
              href="/auth/register?role=institution"
              className="inline-flex items-center px-8 py-4 bg-primary-600 text-white font-bold text-lg rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/25"
            >
              开始第一步：免费注册 →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 md:py-24 bg-white">
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
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors font-medium text-gray-900">
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
      <section className="py-16 md:py-20 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container-main max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            准备好开始了吗？
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            立即免费入驻，加入厦门优质培训机构的行列
          </p>
          <Link
            href="/auth/register?role=institution"
            className="inline-flex items-center px-10 py-4 bg-white text-primary-700 font-bold text-lg rounded-xl hover:bg-primary-50 transition-colors shadow-lg"
          >
            免费开通机构账号
          </Link>
        </div>
      </section>
    </>
  );
}
