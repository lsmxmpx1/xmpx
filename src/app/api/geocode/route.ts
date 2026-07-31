import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/amap";

// 地理编码接口：把地址解析为经纬度（经高德 Web 服务 Key，Key 仅存于服务端）
// 前端地图选点/保存校区前调用：GET /api/geocode?address=...&city=厦门
export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  const city = request.nextUrl.searchParams.get("city") || "厦门";

  if (!address || address.trim().length < 3) {
    return NextResponse.json({ error: "地址太短，请填写更完整的地址" }, { status: 400 });
  }

  const result = await geocodeAddress(address.trim(), city);
  if (!result) {
    return NextResponse.json(
      { error: "地址解析失败，请检查地址或稍后重试（高德 Key 未配置也可能导致失败）" },
      { status: 422 }
    );
  }

  return NextResponse.json(result);
}
