export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatPrice(price: string | null): string {
  if (!price) return "价格面议";
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  if (num === 0) return "免费";
  return `¥${num.toLocaleString("zh-CN")}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

// —— 多身份角色工具 ——
// 归一化：始终包含 USER、去空格、去重，保持稳定顺序（USER, TEACHER, INSTITUTION, ADMIN）
export function normalizeRoles(input: string | string[] | null | undefined): string[] {
  const order = ["USER", "TEACHER", "INSTITUTION", "ADMIN"];
  const raw = Array.isArray(input)
    ? input
    : (input || "").split(",");
  const set = new Set<string>();
  set.add("USER");
  for (const r of raw) {
    const v = (r || "").trim().toUpperCase();
    if (v) set.add(v);
  }
  return Array.from(set).sort(
    (a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    }
  );
}

// 逗号串形式（写库用）
export function rolesToString(input: string | string[] | null | undefined): string {
  return normalizeRoles(input).join(",");
}

export const ROLE_LABELS: Record<string, string> = {
  USER: "学员",
  TEACHER: "老师",
  INSTITUTION: "机构",
  ADMIN: "管理员",
};

export const DISTRICTS = [
  "思明区",
  "湖里区",
  "集美区",
  "海沧区",
  "同安区",
  "翔安区",
];

export const ARTICLE_CATEGORIES = [
  "教育政策",
  "考试资讯",
  "学习方法",
  "机构动态",
  "家长必读",
];

export const AD_POSITIONS = [
  "首页顶部横幅",
  "首页中部横幅",
  "分类页顶部",
  "分类页侧边栏",
  "资讯页侧边栏",
  "机构详情侧边栏",
];
