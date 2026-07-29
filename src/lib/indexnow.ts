/**
 * IndexNow 协议封装
 *
 * IndexNow 是 Bing/Google/Yandex 等搜索引擎支持的即时通知协议：
 * 内容更新后主动推送 URL，搜索引擎会尽快抓取，无需等待定期爬取。
 * 文档：https://www.indexnow.org/
 *
 * 使用方式：
 *   - API 路由：POST /api/indexnow { urls: string[] }
 *   - 代码内调用：await notifyIndexNow(["https://www.xmpx.cn/courses/123"])
 */

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const SITE_HOST = "https://www.xmpx.cn";
const INDEXNOW_KEY = "a939209eafbc46adab4516023a83acf7";

/** 单次请求最多提交的 URL 数量（IndexNow 规范上限 10000，实际建议批量 ≤ 100） */
const BATCH_SIZE = 100;

export interface IndexNowResult {
  success: boolean;
  error?: string;
}

/**
 * 向 IndexNow 提交 URL 列表（通知搜索引擎收录）
 *
 * @param urls 完整 URL 列表（如 https://www.xmpx.cn/courses/123）
 * @param options.keyLocation 可选自定义 key 文件路径（默认根目录）
 */
export async function notifyIndexNow(
  urls: string[],
  options?: { keyLocation?: string },
): Promise<IndexNowResult> {
  if (!urls || urls.length === 0) {
    return { success: true }; // 空 URL 视为成功
  }

  // 过滤空值 + 去重
  const unique = Array.from(new Set(urls.filter(Boolean)));

  // 分批提交（每批最多 BATCH_SIZE）
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    const result = await submitBatch(batch, options?.keyLocation);
    if (!result.success) {
      return result; // 任一批失败即返回错误
    }
  }

  return { success: true };
}

async function submitBatch(
  urls: string[],
  keyLocation?: string,
): Promise<IndexNowResult> {
  try {
    const body = {
      host: new URL(SITE_HOST).hostname, // "www.xmpx.cn"
      key: INDEXNOW_KEY,
      keyLocation: keyLocation || `${SITE_HOST}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    };

    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      console.log(`[IndexNow] 提交成功: ${urls.length} 个 URL`);
      return { success: true };
    }

    const text = await res.text().catch(() => "");
    console.error(`[IndexNow] 提交失败 HTTP ${res.status}: ${text}`);
    return {
      success: false,
      error: `IndexNow 返回 HTTP ${res.status}${text ? `: ${text}` : ""}`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[IndexNow] 网络异常: ${msg}`);
    return { success: false, error: `网络请求失败: ${msg}` };
  }
}

/**
 * 构建站点完整 URL（辅助函数）
 * @param path 相对路径，如 /courses/123
 */
export function siteUrl(path: string): string {
  return `${SITE_HOST}${path.startsWith("/") ? path : `/${path}`}`;
}
