import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

marked.setOptions({ gfm: true, breaks: true });

/**
 * 将 Markdown 源码转换为安全的 HTML 字符串。
 * - marked 负责解析（GFM + 单换行转 <br>）
 * - sanitize-html 负责清除潜在 XSS（脚本、危险属性、危险协议等）
 * 同时兼容历史纯文本正文：无标签的纯文本会被当作段落/换行渲染。
 */
export function renderMarkdown(md: string): string {
  if (!md || !md.trim()) return "";
  const rawHtml = marked.parse(md) as string;
  return sanitizeHtml(rawHtml, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "strong", "b", "em", "i", "u", "s", "del",
      "ul", "ol", "li", "blockquote",
      "a", "code", "pre", "span",
      "img", "table", "thead", "tbody", "tr", "th", "td",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      code: ["class"],
      span: ["class"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer nofollow",
        target: "_blank",
      }),
    },
  });
}
