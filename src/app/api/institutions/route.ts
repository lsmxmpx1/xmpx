import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify, rolesToString } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const { name, district, address, phone, description, website, logo, cover, images } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "机构名称至少2个字符" }, { status: 400 });
    }

    if (!district) {
      return NextResponse.json({ error: "请选择所在区域" }, { status: 400 });
    }

    // Check if user already owns an institution
    const existing = await prisma.institution.findUnique({ where: { ownerId: userId } });
    if (existing) {
      return NextResponse.json({ error: "您已拥有机构，请直接编辑" }, { status: 400 });
    }

    // Generate unique slug
    let slug = slugify(name);
    const existingSlug = await prisma.institution.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const inst = await prisma.institution.create({
      data: {
        name: name.trim(),
        slug,
        district,
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        description: description?.trim() || null,
        website: website?.trim() || null,
        logo: logo?.trim() || null,
        cover: cover?.trim() || null,
        images: images?.trim() || null,
        status: "PENDING",
        ownerId: userId,
      },
    });

    // 写入多身份 roles（与老师流程一致）：把 INSTITUTION 追加进逗号分隔的 roles 字符串，
    // 否则用户中心「我是机构」会一直显示「未开通」
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { roles: true } });
    const newRolesStr = rolesToString([...(user?.roles?.split(",") || []), "INSTITUTION"]);
    await prisma.user.update({
      where: { id: userId },
      data: { roles: newRolesStr, role: "INSTITUTION" },
    });

    return NextResponse.json({ success: true, id: inst.id, roles: newRolesStr.split(",") });
  } catch (error) {
    console.error("Create institution error:", error);
    return NextResponse.json({ error: "创建失败，请稍后再试" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const { name, district, address, phone, description, website, logo, cover, images } = body;

    // Find user's institution
    const inst = await prisma.institution.findUnique({ where: { ownerId: userId } });
    if (!inst) {
      return NextResponse.json({ error: "您还没有机构" }, { status: 404 });
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "机构名称至少2个字符" }, { status: 400 });
    }

    if (!district) {
      return NextResponse.json({ error: "请选择所在区域" }, { status: 400 });
    }

    await prisma.institution.update({
      where: { id: inst.id },
      data: {
        name: name.trim(),
        district,
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        description: description?.trim() || null,
        website: website?.trim() || null,
        logo: logo?.trim() || null,
        cover: cover?.trim() || null,
        images: images?.trim() || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update institution error:", error);
    return NextResponse.json({ error: "更新失败，请稍后再试" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const inst = await prisma.institution.findUnique({
      where: { ownerId: userId },
      include: {
        _count: {
          select: { courses: true, reviews: true },
        },
      },
    });

    if (!inst) {
      return NextResponse.json({ institution: null });
    }

    return NextResponse.json({ institution: inst });
  } catch (error) {
    console.error("Get institution error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
