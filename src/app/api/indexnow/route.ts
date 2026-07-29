import { NextRequest, NextResponse } from "next/server";
import { notifyIndexNow, siteUrl } from "@/lib/indexnow";

/**
 * POST /api/indexnow
 *
 * 提交 URL 到 IndexNow（通知 Bing/Google 等搜索引擎即时收录）
 *
 * 请求体：
 *   - urls: string[] — 完整 URL 列表（如 ["https://www.xmpx.cn/courses/123"]）
 *   或
 *   - paths: string[] — 相对路径列表（如 ["/courses/123"]，自动补全域名）
 *
 * 权限：仅管理员可调用（通过 session 鉴权）
 */
export async function POST(req: NextRequest) {
  try {
    // ─── 鉴权：仅管理员可用 ───
    const session = await getServerSession(req);
    if (!session?.user?.roles?.includes("ADMIN")) {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const body = await req.json();
    let urls: string[];

    if (body.urls && Array.isArray(body.urls)) {
      // 完整 URL 模式
      urls = body.urls;
    } else if (body.paths && Array.isArray(body.paths)) {
      // 相对路径模式，自动补全域名
      urls = body.paths.map((p: string) => siteUrl(p));
    } else {
      return NextResponse.json(
        { error: '请提供 urls (完整URL数组) 或 paths (相对路径数组)' },
        { status: 400 },
      );
    }

    // 校验 URL 格式
    for (const url of urls) {
      if (typeof url !== "string" || !url.startsWith("http")) {
        return NextResponse.json(
          { error: `无效的 URL: ${url}` },
          { status: 400 },
        );
      }
    }

    // IndexNow 单次上限 10000，但建议 ≤ 100
    if (urls.length > 10000) {
      return NextResponse.json(
        { error: "单次提交不能超过 10000 个 URL" },
        { status: 400 },
      );
    }

    const result = await notifyIndexNow(urls);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `已成功提交 ${urls.length} 个 URL 到 IndexNow`,
        submittedCount: urls.length,
      });
    }

    return NextResponse.json({ error: result.error }, { status: 500 });
  } catch (e) {
    console.error("[IndexNow API]", e);
    return NextResponse.json({ error: "IndexNow 提交失败" }, { status: 500 });
  }
}

/**
 * 获取当前 session（复用项目已有的 auth 配置）
 * 注意：NextAuth v5 的 getServerSession 用法取决于项目配置，
 * 这里做兼容处理避免 import 报错。
 */
async function getServerSession(req: NextRequest) {
  try {
    // 动态导入避免循环依赖 / 构建问题
    const { auth } = await import("@/lib/auth");
    // NextAuth v5 beta 的 getServerSession 接收 request 对象
    return await auth();
  } catch {
    // auth 未配置或出错时返回 null（降级为无权限）
    console.warn("[IndexNow] 无法获取 session，鉴权将失败");
    return null;
  }
}
