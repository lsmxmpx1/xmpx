import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import InstitutionForm from "./InstitutionForm";
import InstitutionDashboard from "./InstitutionDashboard";
import RoleSwitcher from "../RoleSwitcher";

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
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <RoleSwitcher current="INSTITUTION" />
        <InstitutionForm mode="create" />
      </div>
    );
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
    <div className="max-w-6xl mx-auto px-4 pt-8">
      <RoleSwitcher current="INSTITUTION" />
      <InstitutionDashboard
        institution={institutionData}
        categories={categoriesForForm}
        contactsCount={contactsCount}
      />
    </div>
  );
}
