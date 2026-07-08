import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "用户协议 - 厦门培训网",
  description: "厦门培训网用户服务协议",
};

export default function TermsPage() {
  return (
    <div className="container-main py-8 max-w-3xl mx-auto">
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">首页</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">用户协议</span>
      </div>
      <h1 className="text-3xl font-bold mb-8">用户服务协议</h1>
      <div className="prose prose-gray max-w-none space-y-4">
        <p>最后更新日期：2026年7月</p>
        <h2>一、服务说明</h2>
        <p>厦门培训网是一个教育培训信息展示平台。用户可在平台上浏览课程、机构信息，进行咨询和评价。</p>
        <h2>二、用户责任</h2>
        <p>用户应确保所发布内容的真实性、合法性，不得发布虚假信息、侵权内容或违法违规信息。</p>
        <h2>三、平台责任</h2>
        <p>平台仅为信息展示服务提供方，不对培训机构的资质、教学质量作任何担保。用户应自行核实机构信息。</p>
        <h2>四、免责声明</h2>
        <p>因不可抗力、系统维护等因素导致的服务中断，平台不承担责任。用户与机构之间的纠纷由双方自行解决。</p>
        <h2>五、协议修改</h2>
        <p>平台有权适时修改本协议，修改后的协议将在平台上公布后生效。</p>
      </div>
    </div>
  );
}
