// 高德地图（AMap）工具集
// ─────────────────────────────────────────────────────────────────────────
// 申请地址：https://console.amap.com/  →  应用管理  →  创建应用  →  添加 Key
//   1) 类型「Web端(JS API)」：得到 JS Key + 安全密钥(jsCode)
//        → 填 NEXT_PUBLIC_AMAP_JS_KEY / NEXT_PUBLIC_AMAP_JS_CODE（公开，前端地图用）
//   2) 类型「Web服务」：得到 Web Key
//        → 填 AMAP_WEB_KEY（仅服务端地理编码用，切勿暴露到前端）
// 详细步骤见本仓库 README / 群消息中的「高德 Key 申请指引」。
// ─────────────────────────────────────────────────────────────────────────

// 前端地图用的 JS Key / 安全密钥（NEXT_PUBLIC_* 会暴露给浏览器，属正常）
export const AMAP_JS_KEY = process.env.NEXT_PUBLIC_AMAP_JS_KEY ?? "";
export const AMAP_JS_CODE = process.env.NEXT_PUBLIC_AMAP_JS_CODE ?? "";

export function amapConfigured(): boolean {
  return AMAP_JS_KEY.length > 0;
}

export interface GeocodeResult {
  lng: number;
  lat: number;
  formattedAddress?: string;
}

// 把任意来源的坐标转成 {lng,lat}，无效返回 null
export function toCoords(lng: unknown, lat: unknown): { lng: number; lat: number } | null {
  const n1 = typeof lng === "number" ? lng : parseFloat(String(lng));
  const n2 = typeof lat === "number" ? lat : parseFloat(String(lat));
  if (Number.isFinite(n1) && Number.isFinite(n2)) return { lng: n1, lat: n2 };
  return null;
}

// 服务端地理编码：地址 -> 经纬度（GCJ-02 坐标系，与高德 JS API 一致）
export async function geocodeAddress(
  address: string,
  city = "厦门"
): Promise<GeocodeResult | null> {
  const key = process.env.AMAP_WEB_KEY;
  if (!key) {
    // 未配置 Web Key 时不阻断流程，返回 null 让调用方决定是否忽略
    return null;
  }

  const url = new URL("https://restapi.amap.com/v3/geocode/geo");
  url.searchParams.set("key", key);
  url.searchParams.set("address", address);
  if (city) url.searchParams.set("city", city);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "1" || !Array.isArray(data.geocodes) || data.geocodes.length === 0) {
      return null;
    }
    const [lng, lat] = String(data.geocodes[0].location).split(",").map(Number);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    return {
      lng,
      lat,
      formattedAddress: data.geocodes[0].formatted_address,
    };
  } catch {
    return null;
  }
}

// 厦门市中心默认视角（用于列表页全市地图的初始 center），GCJ-02
export const XIAMEN_CENTER = { lng: 118.0894, lat: 24.4798 };
export const XIAMEN_DISTRICT_CENTERS: Record<string, { lng: number; lat: number }> = {
  思明区: { lng: 118.087, lat: 24.457 },
  湖里区: { lng: 118.135, lat: 24.525 },
  集美区: { lng: 118.095, lat: 24.575 },
  海沧区: { lng: 118.045, lat: 24.485 },
  同安区: { lng: 118.155, lat: 24.725 },
  翔安区: { lng: 118.245, lat: 24.625 },
};
