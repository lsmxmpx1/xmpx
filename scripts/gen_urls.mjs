// 生成网站 URL 列表（纯导出，不自动推送），用于手动提交到百度搜索资源平台。
//
// 与 src/app/sitemap.ts 保持完全一致，确保推送的 URL 与 sitemap 收录一致。
//
// 用法：
//   本地（dev.db）：
//     node scripts/gen_urls.mjs
//   生产（Turso，需先设置环境变量）：
//     $env:DATABASE_URL="libsql://xxxx.turso.io"
//     $env:TURSO_AUTH_TOKEN="<token>"
//     node scripts/gen_urls.mjs
//
// 可选覆盖：
//   BASE_URL       站点域名（默认 https://www.xmpx.cn）
//   OUTPUT_DIR     输出目录（默认 scripts/）
//   CHUNK          每文件最大条数（默认 2000，百度单文件上限）
//
// 输出：
//   scripts/urls.txt            全部 URL（一行一条）
//   scripts/urls_part_0001.txt  超 2000 条时自动拆分，便于逐文件上传

import { createClient } from "@libsql/client";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE_URL = process.env.BASE_URL || "https://www.xmpx.cn";
const OUTPUT_DIR = process.env.OUTPUT_DIR || __dirname;
const CHUNK = Number(process.env.CHUNK || 2000);

const DISTRICTS = ["思明区", "湖里区", "集美区", "海沧区", "同安区", "翔安区"];

const url = process.env.DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient(
  authToken ? { url, authToken } : { url }
);

async function ids(sql) {
  const rows = await db.execute(sql);
  return rows.rows.map((r) => r.id);
}
async function slugs(sql) {
  const rows = await db.execute(sql);
  return rows.rows.map((r) => r.slug);
}

async function buildUrls() {
  const [courseIds, instIds, teacherIds, articleIds, questionIds, categorySlugs] =
    await Promise.all([
      ids(`SELECT id FROM Course`),
      ids(`SELECT id FROM Institution`),
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

  return [
    ...staticPages.map((p) => BASE_URL + p),
    ...courseIds.map((id) => `${BASE_URL}/courses/${id}`),
    ...instIds.map((id) => `${BASE_URL}/institutions/${id}`),
    ...teacherIds.map((id) => `${BASE_URL}/teachers/${id}`),
    ...articleIds.map((id) => `${BASE_URL}/articles/${id}`),
    ...questionIds.map((id) => `${BASE_URL}/questions/${id}`),
    ...categorySlugs.map((s) => `${BASE_URL}/courses/category/${s}`),
    ...DISTRICTS.map((d) => `${BASE_URL}/courses/district/${encodeURIComponent(d)}`),
  ];
}

function writeChunks(urls) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const full = join(OUTPUT_DIR, "urls.txt");
  writeFileSync(full, urls.join("\n") + "\n", "utf8");
  console.log(`  ✓ 已写入全量文件: ${full} (${urls.length} 条)`);

  if (urls.length > CHUNK) {
    let part = 1;
    for (let i = 0; i < urls.length; i += CHUNK) {
      const batch = urls.slice(i, i + CHUNK);
      const name = join(OUTPUT_DIR, `urls_part_${String(part).padStart(4, "0")}.txt`);
      writeFileSync(name, batch.join("\n") + "\n", "utf8");
      console.log(`  ✓ 分片文件: ${name} (${batch.length} 条)`);
      part++;
    }
  }
}

async function main() {
  console.log(`[1/2] 从数据库生成 URL 列表 (BASE_URL=${BASE_URL}) ...`);
  const urls = await buildUrls();
  console.log(
    `      静态页 + 课程(${urls.filter((u) => /\/courses\/[a-z0-9]/i.test(u) && !/\/(category|district)/.test(u)).length})` +
      ` + 机构 + 老师 + 文章 + 问答 + 分类 + 区域`
  );
  console.log(`      共 ${urls.length} 条`);

  console.log(`[2/2] 写出文件 (CHUNK=${CHUNK}) ...`);
  writeChunks(urls);
  console.log("完成。将 urls.txt（或分片文件）粘贴/上传到百度搜索资源平台「链接提交 - 普通收录」即可。");
}

main().catch((e) => {
  console.error("[异常]", e?.message || e);
  process.exit(1);
});
