import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { geocodeAddress, toCoords } from "@/lib/amap";

// 列出当前用户机构的全部校区（按 sortOrder 升序）
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const inst = await prisma.institution.findUnique({ where: { ownerId: session.user.id } });
    if (!inst) {
      return NextResponse.json({ campuses: [] });
    }
    const campuses = await prisma.campus.findMany({
      where: { institutionId: inst.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ campuses });
  } catch (error) {
    console.error("List campuses error:", error);
    return NextResponse.json({ error: "获取校区失败" }, { status: 500 });
  }
}

// 新增校区（归属当前用户机构）
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const inst = await prisma.institution.findUnique({ where: { ownerId: session.user.id } });
  if (!inst) {
    return NextResponse.json({ error: "您还没有机构" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { name, address, district, phone, images, lng, lat, isMain, sortOrder } = body;

    if (!name || name.trim().length < 1) {
      return NextResponse.json({ error: "请填写校区名称" }, { status: 400 });
    }

    // 服务端兜底地理编码：前端未传坐标但有地址时自动解析
    let coords = toCoords(lng, lat);
    if (!coords && address && String(address).trim()) {
      const geo = await geocodeAddress(String(address).trim(), district || "厦门");
      if (geo) coords = { lng: geo.lng, lat: geo.lat };
    }

    const campus = await prisma.campus.create({
      data: {
        institutionId: inst.id,
        name: name.trim(),
        address: address?.trim() || null,
        district: district || null,
        phone: phone?.trim() || null,
        images: images?.trim() || null,
        lng: coords?.lng ?? null,
        lat: coords?.lat ?? null,
        isMain: isMain === true,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      },
    });

    // 若设为主校区，取消其它校区的 isMain
    if (campus.isMain) {
      await prisma.campus.updateMany({
        where: { institutionId: inst.id, id: { not: campus.id } },
        data: { isMain: false },
      });
    }

    return NextResponse.json({ success: true, campus });
  } catch (error) {
    console.error("Create campus error:", error);
    return NextResponse.json({ error: "创建校区失败" }, { status: 500 });
  }
}
