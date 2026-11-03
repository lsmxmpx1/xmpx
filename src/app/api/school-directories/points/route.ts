import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DISTRICTS } from "@/lib/utils";

// 地图点接口：返回系统机构名录（用于「在地图上找机构」）
// GET /api/school-directories/points?district=思明区
// 始终读取数据库最新数据（机构名录会随后台录入/批量导入变化，不应被缓存）
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const district = request.nextUrl.searchParams.get("district") || "";

  try {
    const where: { status: string; district?: string } = { status: "PUBLISHED" };
    if (district && DISTRICTS.includes(district)) {
      where.district = district;
    }

    const schools = await prisma.schoolDirectory.findMany({
      where,
      select: {
        id: true,
        name: true,
        address: true,
        district: true,
        lng: true,
        lat: true,
      },
      orderBy: { name: "asc" },
      take: 500,
    });

    return NextResponse.json({ schools });
  } catch (error) {
    console.error("School points error:", error);
    return NextResponse.json({ error: "获取地图点失败" }, { status: 500 });
  }
}
