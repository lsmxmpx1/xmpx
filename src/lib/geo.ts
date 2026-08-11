import { headers } from "next/headers";

/**
 * 常见国家/地区 ISO 3166-1 alpha-2 代码 → 中文名映射。
 * 仅覆盖高频地区，未列出的代码将直接回退为代码本身。
 * 中国港澳台按官方表述处理（中国香港 / 中国澳门 / 中国台湾）。
 */
const COUNTRY_MAP: Record<string, string> = {
  CN: "中国",
  HK: "中国香港",
  MO: "中国澳门",
  TW: "中国台湾",
  US: "美国",
  JP: "日本",
  KR: "韩国",
  KP: "朝鲜",
  GB: "英国",
  FR: "法国",
  DE: "德国",
  IT: "意大利",
  ES: "西班牙",
  PT: "葡萄牙",
  RU: "俄罗斯",
  SG: "新加坡",
  MY: "马来西亚",
  TH: "泰国",
  VN: "越南",
  PH: "菲律宾",
  ID: "印度尼西亚",
  IN: "印度",
  BD: "孟加拉国",
  PK: "巴基斯坦",
  KZ: "哈萨克斯坦",
  MN: "蒙古",
  AU: "澳大利亚",
  NZ: "新西兰",
  CA: "加拿大",
  MX: "墨西哥",
  BR: "巴西",
  AR: "阿根廷",
  CL: "智利",
  ZA: "南非",
  EG: "埃及",
  AE: "阿联酋",
  SA: "沙特阿拉伯",
  TR: "土耳其",
  IL: "以色列",
  NL: "荷兰",
  BE: "比利时",
  CH: "瑞士",
  AT: "奥地利",
  SE: "瑞典",
  NO: "挪威",
  DK: "丹麦",
  FI: "芬兰",
  PL: "波兰",
  IE: "爱尔兰",
  CZ: "捷克",
  GR: "希腊",
  UA: "乌克兰",
  RO: "罗马尼亚",
  HU: "匈牙利",
  PT_: "葡萄牙",
};

export interface ClientGeo {
  /** 客户端 IP（取 x-forwarded-for 首段；本地开发时为"本地"） */
  ipAddress: string;
  /** 国家中文名；无法识别时为 null */
  ipCountry: string | null;
  /** 城市名；无法识别时为 null（Vercel 头或 API 均无） */
  ipCity: string | null;
}

// ── IP 地理定位兜底 API ──

/** 免费无需 key 的 IP 地理定位接口（限 45 次/分钟，足够留言板使用） */
const FALLBACK_GEO_API = "http://ip-api.com/json/";

interface IpApiResult {
  status: "success" | "fail";
  city?: string;
  regionName?: string; // 省份名（英文）
  country?: string;
  countryCode?: string;
}

/**
 * 当 Vercel Geo 头未返回城市时，通过第三方 API 查询城市名。
 * 仅在服务端调用（Server Action / Route Handler）。
 * 返回城市英文名（如 "Xiamen"、"Zhangzhou"），查询失败返回 null。
 */
export async function resolveCityByIp(ip: string): Promise<string | null> {
  if (!ip || ip === "本地" || ip === "127.0.0.1" || ip === "::1") return null;
  // 私有地址 / 内网不查
  if (
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("172.3") ||
    ip.startsWith("192.168.") ||
    ip === "localhost"
  ) {
    return null;
  }
  try {
    const res = await fetch(`${FALLBACK_GEO_API}${ip}?fields=status,city,regionName`, {
      next: { revalidate: 86400 }, // 缓存一天（同一 IP 不重复请求）
      signal: AbortSignal.timeout(3000), // 3s 超时
    });
    if (!res.ok) return null;
    const data: IpApiResult = await res.json();
    return data.status === "success" ? (data.city?.trim() || data.regionName?.trim() || null) : null;
  } catch {
    return null; // 网络错误等静默失败，不影响主流程
  }
}

// ── 主函数：从请求头解析地理信息 ──

/**
 * 从请求头解析匿名留言者的 IP 与国家/城市。
 * - 生产（Vercel）：x-forwarded-for / x-vercel-ip-country / x-vercel-ip-city
 * - 本地开发：上述头不存在，回退为 null（前端显示"本地/未知"）
 *
 * 注意：仅在服务端（Server Action / Route Handler）调用，
 * headers() 在请求上下文中可用。
 *
 * 返回的 ipCity 可能因 Vercel 头缺失而为 null；
 * 调发方可在需要时用 resolveCityByIp(ip) 异步补查。
 */
export function getClientGeo(): ClientGeo {
  const h = headers();

  // ── IP ──
  const xff = h.get("x-forwarded-for");
  const ip = xff
    ? xff.split(",")[0]?.trim() || "本地"
    : (h.get("x-real-ip")?.trim() || "本地");

  // ── 国家（Vercel 提供 ISO 代码） ──
  const countryCode = h.get("x-vercel-ip-country");
  let ipCountry: string | null = null;
  if (countryCode) {
    const code = countryCode.toUpperCase();
    ipCountry = COUNTRY_MAP[code] ?? code;
  }

  // ── 城市（Vercel 提供 URL 编码的中文/英文） ──
  const cityRaw = h.get("x-vercel-ip-city");
  let ipCity: string | null = null;
  if (cityRaw) {
    try {
      ipCity = decodeURIComponent(cityRaw);
    } catch {
      ipCity = cityRaw;
    }
  }

  return { ipAddress: ip, ipCountry, ipCity };
}

/**
 * 获取完整地理信息（含 API 兜底城市查询）。
 * 先从 Vercel 头读取；若城市为空且 IP 非内网，异步调 API 补查。
 * 推荐在留言提交等场景使用此函数替代 getClientGeo()。
 */
export async function getClientGeoWithCity(): Promise<ClientGeo> {
  const geo = getClientGeo();
  if (!geo.ipCity && geo.ipAddress && geo.ipAddress !== "本地") {
    const fallbackCity = await resolveCityByIp(geo.ipAddress);
    if (fallbackCity) geo.ipCity = fallbackCity;
  }
  return geo;
}

/**
 * 将地理信息拼成一句用于展示的文本，例如：
 *   "来自 1.2.3.4 · 中国 厦门市"
 *   "来自 1.2.3.4 · 本地" （本地开发/无地区信息）
 */
export function formatGeoLine(geo: Pick<ClientGeo, "ipAddress" | "ipCountry" | "ipCity">): string {
  const parts = [geo.ipAddress];
  if (geo.ipCountry || geo.ipCity) {
    const region = [geo.ipCountry, geo.ipCity].filter(Boolean).join(" ");
    if (region) parts.push(region);
  }
  return parts.join(" · ");
}
