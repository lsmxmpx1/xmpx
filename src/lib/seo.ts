import { SITE_URL } from "@/lib/constants";

// 面包屑结构化数据辅助。传入层级路径即可生成 BreadcrumbList JSON-LD。
// 首项一般为首页「/」。
export type Crumb = { name: string; path: string };

export function breadcrumbLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}

// 把可能为 null/undefined 的字段转为可选 key，避免输出 null 导致校验告警。
export function defined<T>(v: T | null | undefined): v is T {
  return v !== null && v !== undefined;
}
