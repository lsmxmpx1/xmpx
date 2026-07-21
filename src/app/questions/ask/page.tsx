import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SITE_NAME } from "@/lib/constants";
import AskQuestionForm from "@/components/qa/AskQuestionForm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    title: `我要提问 - 问答社区 - ${SITE_NAME}`,
    robots: { index: false, follow: true },
  };
}

export default async function AskPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login?redirect=/questions/ask");
  }

  return (
    <div className="container-main py-8 max-w-3xl">
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-primary-600">
          首页
        </Link>
        <span className="mx-2">/</span>
        <Link href="/questions" className="hover:text-primary-600">
          问答社区
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">我要提问</span>
      </div>

      <h1 className="text-2xl font-bold mb-1">我要提问</h1>
      <p className="text-gray-500 mb-6">选择对应板块，详细描述你的问题。提问将进入人工审核，通过后为全网可见。</p>

      <AskQuestionForm />
    </div>
  );
}
