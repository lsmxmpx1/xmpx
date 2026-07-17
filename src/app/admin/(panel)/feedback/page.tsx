import { prisma } from "@/lib/prisma";
import AdminFeedbackClient from "./AdminFeedbackClient";

export const dynamic = "force-dynamic";

export default async function AdminFeedback() {
  const list = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, name: true, image: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  return <AdminFeedbackClient list={JSON.parse(JSON.stringify(list))} />;
}
