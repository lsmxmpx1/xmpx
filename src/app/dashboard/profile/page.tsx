import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "个人设置 | 厦门培训网",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) return redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) return redirect("/auth/login");

  return (
    <ProfileForm
      user={{
        ...user,
        createdAt: user.createdAt.toISOString(),
      }}
    />
  );
}
