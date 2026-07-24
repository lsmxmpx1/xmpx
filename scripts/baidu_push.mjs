// 百度搜索资源平台「API 提交」批量推送脚本
// 用法（PowerShell）：
//   $env:DATABASE_URL="libsql://xxxx.turso.io"
//   $env:TURSO_AUTH_TOKEN="<token>"
//   node scripts/baidu_push.mjs
//
// 可选环境变量覆盖：
//   BAIDU_SITE   站点（默认 www.xmpx.cn）
//   BAIDU_TOKEN  推送 token（默认下方截图中的 token）
//   BAIDU_API    推送接口地址（默认 http://data.zz.baidu.com/urls）
//   BAIDU_BATCH  每批条数（默认 2000，百度单次上限）
//   BAIDU_LIMIT  只推送前 N 条（调试用，不填则全部）

import { createClient } from "@libsql/client";

const BASE_URL = "https://www.xmpx.cn";
const SITE = process.env.BAIDU_SITE || "www.xmpx.cn";
const TOKEN = process.env.BAIDU_TOKEN || "PEiKdvyjhZCyQrWI3";
const API = process.env.BAIDU_API || "http://data.zz.baidu.com/urls";
const BATCH = Number(process.env.BAIDU_BATCH || 2000);
const LIMIT = process.env.BAIDU_LIMIT ? Number(process.env.BAIDU_LIMIT) : Infinity;

const DISTRICTS = ["思明区", "湖里区", "集美区", "海沧区", "同安区", "翔安区"];

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("[错误] 请先设置 DATABASE_URL 和 TURSO_AUTH_TOKEN 环境变量");
  process.exit(1);
}

const db = createClient({ url, authToken });

async function ids(sql) {
  const rows = await db.execute(sql);
  return rows.rows.map((r) => r.id);
}
async function slugs(sql) {
  const rows = await db.execute(sql);
  return rows.rows.map((r) => r.slug);
}

async function buildUrls() {
  // 与 sitemap.ts 对齐，但只推送已发布/公开的页面，避免收录草稿
  const [courseIds, instIds, teacherIds, articleIds, questionIds, categorySlugs] =
    await Promise.all([
      ids(`SELECT id FROM Course WHERE status = 'ACTIVE'`),
      ids(`SELECT id FROM Institution WHERE status = 'APPROVED'`),
      ids(`SELECT id FROM Teacher`),
      ids(`SELECT id FROM Article WHERE published = 1`),
      ids(`SELECT id FROM Question WHERE isPublic = 1`),
      slugs(`SELECT slug FROM Category`),
    ]);

  const staticPages = [
    "",
    "/courses",
    "/institutions",
    "/teachers",
    "/articles",
    "/questions",
    "/about",
    "/contact",
    "/feedback",
    "/recommend",
    "/privacy",
    "/terms",
  ];

  const urls = [
    ...staticPages.map((p) => BASE_URL + p),
    ...courseIds.map((id) => `${BASE_URL}/courses/${id}`),
    ...instIds.map((id) => `${BASE_URL}/institutions/${id}`),
    ...teacherIds.map((id) => `${BASE_URL}/teachers/${id}`),
    ...articleIds.map((id) => `${BASE_URL}/articles/${id}`),
    ...questionIds.map((id) => `${BASE_URL}/questions/${id}`),
    ...categorySlugs.map((s) => `${BASE_URL}/courses/category/${s}`),
    ...DISTRICTS.map((d) => `${BASE_URL}/courses/district/${encodeURIComponent(d)}`),
  ];

  return urls;
}

async function pushBatch(lines) {
  const body = lines.join("\n");
  const endpoint = `${API}?site=${encodeURIComponent(SITE)}&token=${encodeURIComponent(TOKEN)}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

async function main() {
  console.log("[1/3] 从数据库生成 URL 列表 ...");
  let urls = await buildUrls();
  if (urls.length > LIMIT) urls = urls.slice(0, LIMIT);
  console.log(`      共 ${urls.length} 条待推送`);

  console.log(`[2/3] 按每批 ${BATCH} 条推送 ...`);
  let successTotal = 0;
  let remain = null;
  let notSameSite = 0;
  let errorLines = [];

  for (let i = 0; i < urls.length; i += BATCH) {
    const batch = urls.slice(i, i + BATCH);
    const { status, data } = await pushBatch(batch);
    const cur = i / BATCH + 1;
    const total = Math.ceil(urls.length / BATCH);

    if (status === 200) {
      successTotal += data.success ?? batch.length;
      remain = data.remain ?? remain;
      notSameSite += data.not_same_site ?? 0;
      console.log(
        `      批次 ${cur}/${total} 成功提交 ${data.success ?? batch.length} 条（剩余配额 ${remain}）`
      );
    } else {
      errorLines.push({ batch: cur, status, data });
      console.error(`      批次 ${cur}/${total} 失败 HTTP ${status}:`, JSON.stringify(data));
    }
  }

  console.log("[3/3] 完成");
  console.log(`      成功: ${successTotal} 条`);
  if (notSameSite) console.log(`      非本站 URL: ${notSameSite} 条`);
  if (remain !== null) console.log(`      当天剩余配额: ${remain} 条`);
  if (errorLines.length) {
    console.error(`      失败批次: ${errorLines.length} 个`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("[异常]", e?.message || e);
  process.exit(1);
});
