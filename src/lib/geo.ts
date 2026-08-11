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
  /** 城市名；无法识别时为 null */
  ipCity: string | null;
}

/**
 * 从请求头解析匿名留言者的 IP 与国家/城市。
 * - 生产（Vercel）：x-forwarded-for / x-vercel-ip-country / x-vercel-ip-city
 * - 本地开发：上述头不存在，回退为 null（前端显示"本地/未知"）
 *
 * 注意：仅在服务端（Server Action / Route Handler）调用，
 * headers() 在请求上下文中可用。
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
