import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import InstitutionForm from "./InstitutionForm";
import InstitutionDashboard from "./InstitutionDashboard";

export const dynamic = "force-dynamic";

export default async function InstitutionDashboardPage() {
  const session = await auth();
  if (!session?.user) return redirect("/auth/login");

  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { ownedInstitution: true },
  });

  // No institution yet → show create form
  if (!user?.ownedInstitution) {
    return <InstitutionForm mode="create" />;
  }

  const inst = user.ownedInstitution;

  // Fetch categories (with parent relations) and contacts count in parallel
  const [allCategories, contactsCount] = await Promise.all([
    prisma.category.findMany({
      include: { parent: true },
      orderBy: { name: "asc" },
    }),
    prisma.contact.count({ where: { institutionId: inst.id } }),
  ]);

  // Group categories: only pass subcategories (with parent info) for course form
  const categoriesForForm = allCategories
    .filter((c) => c.parentId !== null)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      parentName: c.parent?.name || "",
    }))
    .sort((a, b) => a.parentName.localeCompare(b.parentName) || a.name.localeCompare(b.name));

  const institutionData = {
    id: inst.id,
    name: inst.name,
    district: inst.district || "未设置",
    address: inst.address,
    phone: inst.phone,
    description: inst.description,
    website: inst.website,
    logo: inst.logo,
    cover: inst.cover,
    images: inst.images,
    status: inst.status,
    rating: inst.rating,
    reviewCount: inst.reviewCount,
    courseCount: inst.courseCount,
    createdAt: inst.createdAt.toISOString(),
  };

  return (
    <InstitutionDashboard
      institution={institutionData}
      categories={categoriesForForm}
      contactsCount={contactsCount}
    />
  );
}
