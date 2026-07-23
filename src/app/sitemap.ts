import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// 构建时 SQLite 并发读会超时，改为动态渲染
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.xmpx.cn";

  const courses = await prisma.course.findMany({ select: { id: true, updatedAt: true } });
  const institutions = await prisma.institution.findMany({ select: { id: true, updatedAt: true } });
  const articles = await prisma.article.findMany({ where: { published: true }, select: { id: true, updatedAt: true } });
  const questions = await prisma.question.findMany({ where: { isPublic: true }, select: { id: true, updatedAt: true } });
  const teachers = await prisma.teacher.findMany({ select: { id: true, updatedAt: true } });
  const categories = await prisma.category.findMany({ select: { slug: true, updatedAt: true } });

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), priority: 1 },
    { url: `${baseUrl}/courses`, lastModified: new Date(), priority: 0.9 },
    { url: `${baseUrl}/institutions`, lastModified: new Date(), priority: 0.9 },
    { url: `${baseUrl}/teachers`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/articles`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/questions`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), priority: 0.4 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), priority: 0.4 },
    { url: `${baseUrl}/feedback`, lastModified: new Date(), priority: 0.4 },
    { url: `${baseUrl}/recommend`, lastModified: new Date(), priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), priority: 0.2 },
  ];

  const coursePages = courses.map((c) => ({
    url: `${baseUrl}/courses/${c.id}`,
    lastModified: c.updatedAt,
    priority: 0.7,
  }));

  const institutionPages = institutions.map((i) => ({
    url: `${baseUrl}/institutions/${i.id}`,
    lastModified: i.updatedAt,
    priority: 0.7,
  }));

  const teacherPages = teachers.map((t) => ({
    url: `${baseUrl}/teachers/${t.id}`,
    lastModified: t.updatedAt,
    priority: 0.6,
  }));

  const articlePages = articles.map((a) => ({
    url: `${baseUrl}/articles/${a.id}`,
    lastModified: a.updatedAt,
    priority: 0.6,
  }));

  const questionPages = questions.map((q) => ({
    url: `${baseUrl}/questions/${q.id}`,
    lastModified: q.updatedAt,
    priority: 0.6,
  }));

  const categoryPages = categories.map((cat) => ({
    url: `${baseUrl}/courses/category/${cat.slug}`,
    lastModified: cat.updatedAt,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...coursePages,
    ...institutionPages,
    ...teacherPages,
    ...articlePages,
    ...questionPages,
    ...categoryPages,
  ];
}
