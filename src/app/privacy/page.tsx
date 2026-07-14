import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "隐私政策 - 厦门培训网",
  description: "厦门培训网隐私政策",
};

export default function PrivacyPage() {
  return (
    <div className="container-main py-8 max-w-3xl mx-auto">
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">首页</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">隐私政策</span>
      </div>
      <h1 className="text-3xl font-bold mb-8">隐私政策</h1>
      <div className="prose prose-gray max-w-none space-y-4">
        <p>最后更新日期：2026年7月</p>
        <h2>一、信息收集</h2>
        <p>我们仅在您注册账号、提交咨询或进行评价时收集必要的个人信息，包括但不限于：姓名、手机号码、电子邮箱地址。</p>
        <h2>二、信息使用</h2>
        <p>收集的信息将用于：提供平台服务、改进用户体验、向您推送相关培训信息（需获得您的同意）。</p>
        <h2>三、信息保护</h2>
        <p>我们采取合理的技术和管理措施保护您的个人信息安全，防止未经授权的访问、使用或泄露。</p>
        <h2>四、信息披露</h2>
        <p>除法律法规要求或经您明确同意外，我们不会向第三方披露您的个人信息。</p>
        <h2>五、联系我们</h2>
        <p>如对本隐私政策有任何疑问，请联系 contact@xmpx.cn。</p>
      </div>
    </div>
  );
}
