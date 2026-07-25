"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { slugify, rolesToString } from "@/lib/utils";

/**
 * 创建 / 更新老师档案（按 userId upsert）。
 * 首次创建成功后，把 TEACHER 追加进 user.roles（多身份）。
 * 返回最新 roles，供前端 update({ activeRole:"TEACHER", roles }) 刷新 session。
 */
export async function upsertTeacher(
  formData: FormData
): Promise<{ error?: string; ok?: boolean; roles?: string[] }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };
  const userId = session.user.id;

  const name = String(formData.get("name") || "").trim();
  const title = String(formData.get("title") || "").trim() || null;
  const bio = String(formData.get("bio") || "").trim() || null;
  const expertise = String(formData.get("expertise") || "").trim() || null;
  const avatar = String(formData.get("avatar") || "").trim() || null;
  const district = String(formData.get("district") || "").trim() || null;
  const currentInstitutionId =
    String(formData.get("currentInstitutionId") || "").trim() || null;

  if (name.length < 2) return { error: "姓名至少 2 个字符" };

  // 校验所属机构是否存在（可选）
  if (currentInstitutionId) {
    const inst = await prisma.institution.findUnique({
      where: { id: currentInstitutionId },
      select: { id: true },
    });
    if (!inst) return { error: "所选机构不存在" };
  }

  const existing = await prisma.teacher.findUnique({ where: { userId } });

  // slug：已存在则沿用；否则由姓名生成，冲突加时间后缀
  let slug = existing?.slug;
  if (!slug) {
    const base = slugify(name) || "teacher";
    slug = base;
    const clash = await prisma.teacher.findUnique({ where: { slug } });
    if (clash) slug = `${base}-${Date.now().toString(36)}`;
  }

  try {
    await prisma.teacher.upsert({
      where: { userId },
      create: {
        userId,
        name,
        title,
        bio,
        expertise,
        avatar,
        district,
        currentInstitutionId,
        slug: slug!,
        status: "ACTIVE",
      },
      update: {
        name,
        title,
        bio,
        expertise,
        avatar,
        district,
        currentInstitutionId,
      },
    });
  } catch {
    return { error: "保存失败，请稍后再试" };
  }

  // 追加 TEACHER 身份
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  const newRolesStr = rolesToString([...(user?.roles?.split(",") || []), "TEACHER"]);
  await prisma.user.update({
    where: { id: userId },
    data: { roles: newRolesStr },
  });

  revalidatePath("/dashboard/teacher");
  revalidatePath("/teachers");
  revalidatePath("/admin/teachers");
  return { ok: true, roles: newRolesStr.split(",") };
}

/** 新增一条任职履历 */
export async function createEmployment(
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!teacher) return { error: "请先创建老师档案" };

  const institutionId = String(formData.get("institutionId") || "").trim();
  const title = String(formData.get("title") || "").trim() || null;
  const startDateStr = String(formData.get("startDate") || "").trim();
  const endDateStr = String(formData.get("endDate") || "").trim();

  if (!institutionId) return { error: "请选择机构" };
  const inst = await prisma.institution.findUnique({
    where: { id: institutionId },
    select: { id: true },
  });
  if (!inst) return { error: "所选机构不存在" };

  await prisma.teacherEmployment.create({
    data: {
      teacherId: teacher.id,
      institutionId,
      title,
      startDate: startDateStr ? new Date(startDateStr) : new Date(),
      endDate: endDateStr ? new Date(endDateStr) : null,
    },
  });

  revalidatePath("/dashboard/teacher");
  revalidatePath("/teachers");
  revalidatePath("/admin/teachers");
  return { ok: true };
}

/** 删除一条任职履历（校验归属） */
export async function deleteEmployment(
  id: string
): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };

  const emp = await prisma.teacherEmployment.findUnique({
    where: { id },
    include: { teacher: { select: { userId: true } } },
  });
  if (!emp) return { error: "记录不存在" };
  if (emp.teacher.userId !== session.user.id) return { error: "无权操作" };

  await prisma.teacherEmployment.delete({ where: { id } });

  revalidatePath("/dashboard/teacher");
  revalidatePath("/teachers");
  revalidatePath("/admin/teachers");
  return { ok: true };
}
