import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "联系我们 - 厦门培训网",
  description: "有任何问题或建议？欢迎联系厦门培训网客服团队。",
};

export default function ContactPage() {
  return (
    <div className="container-main py-8">
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">首页</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">联系我们</span>
      </div>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">联系我们</h1>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="text-3xl mb-3">📧</div>
            <h3 className="font-bold mb-2">电子邮件</h3>
            <p className="text-gray-600">contact@xiamenpeixun.com</p>
            <p className="text-sm text-gray-400 mt-1">我们会在24小时内回复</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="text-3xl mb-3">📞</div>
            <h3 className="font-bold mb-2">客服电话</h3>
            <p className="text-gray-600">0592-XXXXXXXX</p>
            <p className="text-sm text-gray-400 mt-1">工作日 9:00 - 18:00</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="text-3xl mb-3">📍</div>
            <h3 className="font-bold mb-2">公司地址</h3>
            <p className="text-gray-600">福建省厦门市思明区</p>
            <p className="text-sm text-gray-400 mt-1">欢迎来访</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="font-bold mb-2">在线咨询</h3>
            <p className="text-gray-600">直接在课程或机构页面点击&ldquo;在线咨询&rdquo;按钮</p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4">常见问题</h2>
        <div className="space-y-4">
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-bold mb-1">如何入驻平台？</h3>
            <p className="text-sm text-gray-600">注册账号后，进入个人中心点击&ldquo;机构入驻&rdquo;，填写相关信息提交审核即可。</p>
          </div>
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-bold mb-1">如何联系机构？</h3>
            <p className="text-sm text-gray-600">在机构详情页和课程详情页都有&ldquo;在线咨询&rdquo;按钮，可直接留言或查看联系方式。</p>
          </div>
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-bold mb-1">信息不准确怎么办？</h3>
            <p className="text-sm text-gray-600">如发现机构或课程信息有误，请通过上方联系方式告知我们，我们会及时核实更正。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
