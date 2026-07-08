import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "关于我们 - 厦门培训网",
  description: "厦门培训网是厦门本地领先的培训教育信息平台，致力于为用户提供最全面、最准确的培训机构和课程信息。",
};

export default function AboutPage() {
  return (
    <div className="container-main py-8">
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">首页</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">关于我们</span>
      </div>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">关于厦门培训网</h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-gray-600 mb-6">
            厦门培训网是厦门本地领先的培训教育信息平台，致力于为用户提供最全面、最准确的培训机构和课程信息。
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">我们的使命</h2>
          <p>
            帮助每一位学习者找到最适合的培训资源，帮助优质培训机构获得更多曝光。
            我们相信，信息透明是教育公平的基础。
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">平台特色</h2>
          <div className="grid sm:grid-cols-2 gap-4 my-4">
            <div className="bg-gray-50 rounded-xl p-5">
              <div className="text-2xl mb-2">🔍</div>
              <h3 className="font-bold mb-1">信息全面</h3>
              <p className="text-sm text-gray-600">覆盖厦门六大区域，涵盖中小学辅导、艺术兴趣、职业技能等全品类培训课程。</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-5">
              <div className="text-2xl mb-2">⭐</div>
              <h3 className="font-bold mb-1">真实评价</h3>
              <p className="text-sm text-gray-600">学员真实评价反馈，帮助您做出更明智的选择。</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-5">
              <div className="text-2xl mb-2">📱</div>
              <h3 className="font-bold mb-1">便捷操作</h3>
              <p className="text-sm text-gray-600">支持手机访问，随时随地查找课程、咨询机构。</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-5">
              <div className="text-2xl mb-2">🆓</div>
              <h3 className="font-bold mb-1">免费入驻</h3>
              <p className="text-sm text-gray-600">培训机构免费入驻，享受基础展示服务。</p>
            </div>
          </div>

          <h2 className="text-xl font-bold mt-8 mb-4">联系我们</h2>
          <p>如果您有任何问题或建议，欢迎通过以下方式联系我们：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>邮箱：contact@xiamenpeixun.com</li>
            <li>电话：0592-XXXXXXXX</li>
            <li>地址：福建省厦门市思明区</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
