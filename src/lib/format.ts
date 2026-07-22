// 统一的日期时间格式化工具。后台管理列表/卡片页共用，避免重复代码。

/**
 * 把 Date / 字符串 / 数字 格式化为 zh-CN 紧凑日期时间。
 * 例如：2026/07/22 14:07
 * 入参为 null / undefined / 非法值时返回 "-"。
 */
export function fmtDateTime(d: Date | string | number | null | undefined): string {
  if (d === null || d === undefined || d === "") return "-";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
