"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/* ----------------------- 课程 ----------------------- */

async function _deleteCourse(id: string) {
  await prisma.favorite.deleteMany({ where: { courseId: id } });
  await prisma.review.deleteMany({ where: { courseId: id } });
  await prisma.contact.deleteMany({ where: { courseId: id } });
  await prisma.course.delete({ where: { id } });
}

export async function deleteCourse(id: string) {
  await _deleteCourse(id);
  revalidatePath("/admin/courses");
}

export async function toggleCourseStatus(id: string) {
  const c = await prisma.course.findUnique({ where: { id }, select: { status: true } });
  if (!c) return;
  const next = c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await prisma.course.update({ where: { id }, data: { status: next } });
  revalidatePath("/admin/courses");
}

/* ----------------------- 机构 ----------------------- */

export async function deleteInstitution(id: string) {
  const courses = await prisma.course.findMany({ where: { institutionId: id }, select: { id: true } });
  for (const c of courses) {
    await _deleteCourse(c.id);
  }
  await prisma.contact.deleteMany({ where: { institutionId: id } });
  await prisma.review.deleteMany({ where: { institutionId: id } });
  await prisma.favorite.deleteMany({ where: { institutionId: id } });
  await prisma.advertisement.deleteMany({ where: { institutionId: id } });
  await prisma.adOrder.deleteMany({ where: { institutionId: id } });
  await prisma.institution.delete({ where: { id } });
  revalidatePath("/admin/institutions");
}

export async function toggleInstitutionFeatured(id: string) {
  const inst = await prisma.institution.findUnique({ where: { id }, select: { featured: true } });
  if (!inst) return;
  await prisma.institution.update({ where: { id }, data: { featured: !inst.featured } });
  revalidatePath("/admin/institutions");
}

export async function approveInstitution(id: string) {
  await prisma.institution.update({ where: { id }, data: { status: "ACTIVE" } });
  revalidatePath("/admin/institutions");
}

export async function rejectInstitution(id: string) {
  await prisma.institution.update({ where: { id }, data: { status: "REJECTED" } });
  revalidatePath("/admin/institutions");
}

/* ----------------------- 分类 ----------------------- */

export async function deleteCategory(id: string) {
  const count = await prisma.course.count({ where: { categoryId: id } });
  if (count > 0) return; // 有课程引用时禁止删除
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
}

/* ----------------------- 用户 ----------------------- */

export async function deleteUser(id: string) {
  await prisma.favorite.deleteMany({ where: { userId: id } });
  await prisma.review.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
}

export async function setUserRole(id: string, role: string) {
  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin/users");
}

/* ----------------------- 文章 ----------------------- */

export async function deleteArticle(id: string) {
  await prisma.article.delete({ where: { id } });
  revalidatePath("/admin/articles");
}

export async function toggleArticlePublished(id: string) {
  const a = await prisma.article.findUnique({ where: { id }, select: { published: true, publishedAt: true } });
  if (!a) return;
  await prisma.article.update({
    where: { id },
    data: { published: !a.published, publishedAt: !a.published ? new Date() : a.publishedAt },
  });
  revalidatePath("/admin/articles");
}

/* ----------------------- 广告 ----------------------- */

export async function deleteAd(id: string) {
  await prisma.advertisement.delete({ where: { id } });
  revalidatePath("/admin/ads");
}

export async function toggleAdActive(id: string) {
  const ad = await prisma.advertisement.findUnique({ where: { id }, select: { active: true } });
  if (!ad) return;
  await prisma.advertisement.update({ where: { id }, data: { active: !ad.active } });
  revalidatePath("/admin/ads");
}

/* ----------------------- 联系留言 ----------------------- */

export async function deleteContact(id: string) {
  await prisma.contact.delete({ where: { id } });
  revalidatePath("/admin/contacts");
}

/* ----------------------- 短信网关配置 ----------------------- */

export async function saveSmsConfig(formData: FormData) {
  const first = await prisma.smsConfig.findFirst();
  const id = first?.id;

  const data = {
    provider: String(formData.get("provider") || "dev"),
    enabled: formData.get("enabled") === "on",
    accessKeyId: String(formData.get("accessKeyId") || "").trim() || null,
    accessKeySecret: String(formData.get("accessKeySecret") || "").trim() || null,
    signName: String(formData.get("signName") || "").trim() || null,
    templateCode: String(formData.get("templateCode") || "").trim() || null,
    secretId: String(formData.get("secretId") || "").trim() || null,
    secretKey: String(formData.get("secretKey") || "").trim() || null,
    sdkAppId: String(formData.get("sdkAppId") || "").trim() || null,
    templateId: String(formData.get("templateId") || "").trim() || null,
    region: String(formData.get("region") || "ap-guangzhou").trim() || "ap-guangzhou",
    endpoint: String(formData.get("endpoint") || "dysmsapi.aliyuncs.com").trim() || "dysmsapi.aliyuncs.com",
  };

  if (id) {
    await prisma.smsConfig.update({ where: { id }, data });
  } else {
    await prisma.smsConfig.create({ data });
  }

  revalidatePath("/admin/settings");
}

import bcrypt from "bcryptjs";

/* ----------------------- 工具 ----------------------- */
function slugify(s: string): string {
  const r = s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return r || Math.random().toString(36).slice(2, 10);
}

/* ----------------------- 分类 添加/修改 ----------------------- */
export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("分类名称不能为空");
  const slug = String(formData.get("slug") || "").trim() || slugify(name);
  const parentId = String(formData.get("parentId") || "").trim() || null;
  const icon = String(formData.get("icon") || "").trim() || null;
  await prisma.category.create({ data: { name, slug, parentId, icon } });
  revalidatePath("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("分类名称不能为空");
  const slugRaw = String(formData.get("slug") || "").trim();
  const slug = slugRaw || slugify(name);
  const parentId = String(formData.get("parentId") || "").trim() || null;
  const icon = String(formData.get("icon") || "").trim() || null;
  await prisma.category.update({ where: { id }, data: { name, slug, parentId, icon } });
  revalidatePath("/admin/categories");
}

/* ----------------------- 用户 添加/修改 ----------------------- */
export async function createUser(formData: FormData) {
  const name = String(formData.get("name") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const role = String(formData.get("role") || "USER");
  const password = String(formData.get("password") || "").trim();
  if (!email && !phone) throw new Error("邮箱和手机至少填写一项");
  if (email) {
    const ex = await prisma.user.findUnique({ where: { email } });
    if (ex) throw new Error("邮箱已存在");
  }
  if (phone) {
    const ex = await prisma.user.findUnique({ where: { phone } });
    if (ex) throw new Error("手机号已存在");
  }
  const hashed = password ? await bcrypt.hash(password, 10) : null;
  await prisma.user.create({ data: { name, email, phone, role, password: hashed } });
  revalidatePath("/admin/users");
}

export async function updateUser(id: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const role = String(formData.get("role") || "USER");
  const password = String(formData.get("password") || "").trim();
  const data: Record<string, unknown> = { name, email, phone, role };
  if (password) data.password = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id }, data });
  revalidatePath("/admin/users");
}

/* ----------------------- 文章 添加/修改 ----------------------- */
export async function createArticle(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) throw new Error("文章标题不能为空");
  const slug = String(formData.get("slug") || "").trim() || slugify(title);
  const summary = String(formData.get("summary") || "").trim() || null;
  const content = String(formData.get("content") || "").trim() || null;
  const cover = String(formData.get("cover") || "").trim() || null;
  const category = String(formData.get("category") || "").trim() || null;
  const tags = String(formData.get("tags") || "").trim() || null;
  const published = formData.get("published") === "on";
  await prisma.article.create({
    data: {
      title,
      slug,
      summary,
      content,
      cover,
      category,
      tags,
      published,
      publishedAt: published ? new Date() : null,
    },
  });
  revalidatePath("/admin/articles");
}

export async function updateArticle(id: string, formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) throw new Error("文章标题不能为空");
  const slugRaw = String(formData.get("slug") || "").trim();
  const slug = slugRaw || slugify(title);
  const summary = String(formData.get("summary") || "").trim() || null;
  const content = String(formData.get("content") || "").trim() || null;
  const cover = String(formData.get("cover") || "").trim() || null;
  const category = String(formData.get("category") || "").trim() || null;
  const tags = String(formData.get("tags") || "").trim() || null;
  const published = formData.get("published") === "on";
  const existing = await prisma.article.findUnique({
    where: { id },
    select: { published: true, publishedAt: true },
  });
  const publishedAt = published ? (existing?.publishedAt ?? new Date()) : existing?.publishedAt;
  await prisma.article.update({
    where: { id },
    data: { title, slug, summary, content, cover, category, tags, published, publishedAt },
  });
  revalidatePath("/admin/articles");
}

/* ----------------------- 广告 添加/修改 ----------------------- */
export async function createAd(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) throw new Error("广告标题不能为空");
  const position = String(formData.get("position") || "HOME_TOP").trim();
  const institutionId = String(formData.get("institutionId") || "").trim() || null;
  const image = String(formData.get("image") || "").trim() || null;
  const link = String(formData.get("link") || "").trim() || null;
  const active = formData.get("active") === "on";
  const startDate = formData.get("startDate") ? new Date(String(formData.get("startDate"))) : null;
  const endDate = formData.get("endDate") ? new Date(String(formData.get("endDate"))) : null;
  await prisma.advertisement.create({
    data: { title, position, institutionId, image, link, active, startDate, endDate },
  });
  revalidatePath("/admin/ads");
}

export async function updateAd(id: string, formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) throw new Error("广告标题不能为空");
  const position = String(formData.get("position") || "HOME_TOP").trim();
  const institutionId = String(formData.get("institutionId") || "").trim() || null;
  const image = String(formData.get("image") || "").trim() || null;
  const link = String(formData.get("link") || "").trim() || null;
  const active = formData.get("active") === "on";
  const startDate = formData.get("startDate") ? new Date(String(formData.get("startDate"))) : null;
  const endDate = formData.get("endDate") ? new Date(String(formData.get("endDate"))) : null;
  await prisma.advertisement.update({
    where: { id },
    data: { title, position, institutionId, image, link, active, startDate, endDate },
  });
  revalidatePath("/admin/ads");
}

/* ----------------------- 广告套餐 AdPlan 增删改 ----------------------- */
export async function createAdPlan(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("套餐名称不能为空");
  const level = String(formData.get("level") || "").trim();
  if (!level) throw new Error("套餐等级(level)不能为空");
  const price = parseFloat(String(formData.get("price") || "0")) || 0;
  const duration = parseInt(String(formData.get("duration") || "0"), 10) || 0;
  const features = String(formData.get("features") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const active = formData.get("active") === "on";
  const sortOrder = parseInt(String(formData.get("sortOrder") || "0"), 10) || 0;

  const exists = await prisma.adPlan.findUnique({ where: { level } });
  if (exists) throw new Error("该等级(level)已存在，请更换");

  await prisma.adPlan.create({
    data: { name, level, price, duration, features, description, active, sortOrder },
  });
  revalidatePath("/admin/ads");
}

export async function updateAdPlan(id: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("套餐名称不能为空");
  const level = String(formData.get("level") || "").trim();
  if (!level) throw new Error("套餐等级(level)不能为空");
  const price = parseFloat(String(formData.get("price") || "0")) || 0;
  const duration = parseInt(String(formData.get("duration") || "0"), 10) || 0;
  const features = String(formData.get("features") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const active = formData.get("active") === "on";
  const sortOrder = parseInt(String(formData.get("sortOrder") || "0"), 10) || 0;

  const dup = await prisma.adPlan.findUnique({ where: { level } });
  if (dup && dup.id !== id) throw new Error("该等级(level)已被其他套餐占用");

  await prisma.adPlan.update({
    where: { id },
    data: { name, level, price, duration, features, description, active, sortOrder },
  });
  revalidatePath("/admin/ads");
}

export async function deleteAdPlan(id: string) {
  const orders = await prisma.adOrder.count({ where: { planId: id } });
  if (orders > 0) throw new Error("该套餐已有订单引用，不可删除");
  await prisma.adPlan.delete({ where: { id } });
  revalidatePath("/admin/ads");
}

export async function toggleAdPlanActive(id: string) {
  const p = await prisma.adPlan.findUnique({ where: { id }, select: { active: true } });
  if (!p) return;
  await prisma.adPlan.update({ where: { id }, data: { active: !p.active } });
  revalidatePath("/admin/ads");
}

/* ----------------------- 留言板 ----------------------- */

export async function updateFeedback(id: string, formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return;
  }
  const status = String(formData.get("status") || "PENDING");
  const adminReply = String(formData.get("adminReply") || "").trim() || null;
  const isPublic = formData.get("isPublic") === "on";
  await prisma.feedback.update({
    where: { id },
    data: { status, adminReply, isPublic },
  });
  revalidatePath("/admin/feedback");
  revalidatePath("/feedback");
}

export async function deleteFeedback(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return;
  await prisma.feedback.delete({ where: { id } });
  revalidatePath("/admin/feedback");
  revalidatePath("/feedback");
}
