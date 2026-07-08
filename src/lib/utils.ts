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
