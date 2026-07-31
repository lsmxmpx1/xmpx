import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DISTRICTS } from "@/lib/utils";

// 地图点接口：返回机构及其校区（用于「找机构」全市地图 / 就近筛选）
// GET /api/institutions/campus-points?district=思明区
export async function GET(request: NextRequest) {
  const district = request.nextUrl.searchParams.get("district") || "";

  try {
    const where: { status: string; district?: string } = { status: "APPROVED" };
    if (district && DISTRICTS.includes(district)) {
      where.district = district;
    }

    const institutions = await prisma.institution.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        district: true,
        logo: true,
        rating: true,
        reviewCount: true,
        address: true,
        campuses: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            name: true,
            lng: true,
            lat: true,
            address: true,
            phone: true,
            isMain: true,
          },
        },
      },
      orderBy: { rating: "desc" },
      take: 300,
    });

    return NextResponse.json({ institutions });
  } catch (error) {
    console.error("Campus points error:", error);
    return NextResponse.json({ error: "获取地图点失败" }, { status: 500 });
  }
}
