import { auth } from "@/lib/auth";
import { getNotifications } from "@/lib/notify";
import { redirect } from "next/navigation";
import NotificationsClient from "./NotificationsClient";

export const metadata = {
  title: "消息中心 - 厦门培训网",
  description: "查看您的私信、咨询、留言回复、评价、问答通知",
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const result = await getNotifications(session.user.id, { take: 50 });

  return <NotificationsClient initialData={result} />;
}
