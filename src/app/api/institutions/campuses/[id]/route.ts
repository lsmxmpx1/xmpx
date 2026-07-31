import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { geocodeAddress, toCoords } from "@/lib/amap";

// 校验校区归属当前用户机构
async function resolveOwnedCampus(campusId: string, userId: string) {
  const inst = await prisma.institution.findUnique({ where: { ownerId: userId } });
  if (!inst) return { error: "您还没有机构", status: 404 } as const;
  const campus = await prisma.campus.findUnique({ where: { id: campusId } });
  if (!campus || campus.institutionId !== inst.id) {
    return { error: "校区不存在或无权操作", status: 404 } as const;
  }
  return { inst, campus };
}

// 更新校区
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const resolved = await resolveOwnedCampus(params.id, session.user.id);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  try {
    const body = await request.json();
    const { name, address, district, phone, images, lng, lat, isMain, sortOrder } = body;

    if (!name || name.trim().length < 1) {
      return NextResponse.json({ error: "请填写校区名称" }, { status: 400 });
    }

    let coords = toCoords(lng, lat);
    if (!coords && address && String(address).trim()) {
      const geo = await geocodeAddress(String(address).trim(), district || "厦门");
      if (geo) coords = { lng: geo.lng, lat: geo.lat };
    }

    const updated = await prisma.campus.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        district: district || null,
        phone: phone?.trim() || null,
        images: images?.trim() || null,
        lng: coords?.lng ?? null,
        lat: coords?.lat ?? null,
        isMain: isMain === true,
        sortOrder: typeof sortOrder === "number" ? sortOrder : resolved.campus.sortOrder,
      },
    });

    // 若设为主校区，取消其它校区的 isMain
    if (updated.isMain) {
      await prisma.campus.updateMany({
        where: { institutionId: resolved.inst.id, id: { not: params.id } },
        data: { isMain: false },
      });
    }

    return NextResponse.json({ success: true, campus: updated });
  } catch (error) {
    console.error("Update campus error:", error);
    return NextResponse.json({ error: "更新校区失败" }, { status: 500 });
  }
}

// 删除校区
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const resolved = await resolveOwnedCampus(params.id, session.user.id);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  try {
    await prisma.campus.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete campus error:", error);
    return NextResponse.json({ error: "删除校区失败" }, { status: 500 });
  }
}
