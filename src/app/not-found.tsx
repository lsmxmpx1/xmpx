import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-8xl font-bold text-primary-200 mb-4">404</div>
      <h1 className="text-2xl font-bold mb-2">页面未找到</h1>
      <p className="text-gray-500 mb-8">您访问的页面可能已被移除或不存在</p>
      <Link href="/" className="btn-primary px-8 py-3">返回首页</Link>
    </div>
  );
}
