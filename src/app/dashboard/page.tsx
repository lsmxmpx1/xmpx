import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import StudentDashboard from "./StudentDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return redirect("/auth/login");

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      reviews: {
        include: {
          course: { select: { id: true, title: true } },
          institution: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      favorites: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              price: true,
              institution: { select: { name: true } },
            },
          },
          institution: { select: { id: true, name: true, district: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      ownedInstitution: { select: { id: true } },
    },
  });

  if (!user) return redirect("/auth/login");

  // Fetch contacts by phone or name (contacts don't have userId in schema)
  // We match by the phone the user registered with, or the name they used
  const contacts = await prisma.contact.findMany({
    where: {
      OR: [
        { phone: user.phone || "__none__" },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };

  return (
    <StudentDashboard
      user={userData}
      reviews={user.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
        course: r.course,
        institution: r.institution,
      }))}
      favorites={user.favorites.map((f) => ({
        id: f.id,
        courseId: f.courseId,
        institutionId: f.institutionId,
        createdAt: f.createdAt.toISOString(),
        course: f.course,
        institution: f.institution,
      }))}
      contacts={contacts.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        message: c.message,
        createdAt: c.createdAt.toISOString(),
        courseId: c.courseId,
        institutionId: c.institutionId,
      }))}
      hasInstitution={!!user.ownedInstitution}
    />
  );
}
