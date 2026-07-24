import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SecurityForm from "./SecurityForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "账号安全 | 厦门培训网",
};

export default async function SecurityPage() {
  const session = await auth();
  if (!session?.user) return redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, phone: true, name: true },
  });

  if (!user) return redirect("/auth/login");

  return (
    <SecurityForm
      email={user.email}
      phone={user.phone}
      name={user.name}
    />
  );
}
