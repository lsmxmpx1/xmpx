import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QA_CATEGORIES } from "@/lib/qa";

function slugify(s: string): string {
  const r = s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9一-龥]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return r.slice(0, 60) || "question";
}

// 创建提问（需登录），进入人工审核队列（默认不公开）
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录后再提问" }, { status: 401 });
  }

  let body: { title?: string; content?: string; category?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const title = String(body.title || "").trim();
  const content = String(body.content || "").trim();
  const category = String(body.category || "").trim();

  if (title.length < 4) return NextResponse.json({ error: "标题至少 4 个字" }, { status: 400 });
  if (content.length < 5) return NextResponse.json({ error: "内容至少 5 个字" }, { status: 400 });
  if (!QA_CATEGORIES.find((c) => c.key === category)) {
    return NextResponse.json({ error: "请选择有效的板块" }, { status: 400 });
  }

  const slugBase = slugify(title);
  const dup = await prisma.question.findUnique({ where: { slug: slugBase } }).catch(() => null);
  const slug = dup ? `${slugBase}-${Math.random().toString(36).slice(2, 7)}` : slugBase;

  const q = await prisma.question.create({
    data: {
      title,
      content,
      category,
      authorId: session.user.id,
      slug,
      status: "PENDING",
      isPublic: false,
    },
  });

  return NextResponse.json({ id: q.id });
}
