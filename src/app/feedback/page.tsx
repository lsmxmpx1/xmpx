import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SessionProviderWrapper } from "./SessionProvider";
import FeedbackPageClient from "./FeedbackPageClient";

// ISR：公开列表每 60s 重新生成一次，避免每次请求都查远程库导致 Vercel 超时
export const revalidate = 60;

const TYPE_LABEL: Record<string, string> = {
  INSTITUTION: "机构问题",
  COURSE: "课程问题",
  OTHER: "其他问题",
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "待处理", cls: "bg-gray-100 text-gray-600" },
  RESOLVED: { label: "已处理", cls: "bg-green-100 text-green-700" },
  TAKEDOWN: { label: "已下架", cls: "bg-red-100 text-red-700" },
  REJECTED: { label: "已驳回", cls: "bg-orange-100 text-orange-700" },
};

export const metadata = {
  title: "网站留言板 | 厦门培训网",
  description: "反馈机构问题、课程问题或其他问题，违规内容将做下架处理，处理结果公开透明。",
};

// 服务端获取数据，传给客户端组件渲染（含回复和头像）
export default async function FeedbackPage() {
  const list = await prisma.feedback.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, name: true, image: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  return (
    <SessionProviderWrapper>
      <FeedbackPageClient
        list={JSON.parse(JSON.stringify(list))}
        typeLabel={TYPE_LABEL}
        statusMeta={STATUS_META}
      />
    </SessionProviderWrapper>
  );
}