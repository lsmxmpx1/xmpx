// 将厦门教育局名录 (institutions.json) 幂等导入生产 Turso 的 SchoolDirectory 表
// 用法：DATABASE_URL=... TURSO_AUTH_TOKEN=... AMAP_WEB_KEY=... node scripts/import-school-directory.mjs
import { createClient } from "@libsql/client";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

const JSON_PATH =
  "D:/app/WorkBuddy/2026-07-01-08-18-17/xm_edu/institutions.json";

const DATABASE_URL = process.env.DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;
const AMAP_WEB_KEY = process.env.AMAP_WEB_KEY;

if (!DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error("缺少 DATABASE_URL 或 TURSO_AUTH_TOKEN 环境变量");
  process.exit(1);
}

const client = createClient({ url: DATABASE_URL, authToken: TURSO_AUTH_TOKEN });

// ── 高德地理编码（GCJ-02） ──
async function geocode(address) {
  if (!AMAP_WEB_KEY || !address) return null;
  const url = new URL("https://restapi.amap.com/v3/geocode/geo");
  url.searchParams.set("key", AMAP_WEB_KEY);
  url.searchParams.set("address", address);
  url.searchParams.set("city", "厦门");
  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    const d = await res.json();
    if (d.status !== "1" || !d.geocodes?.length) return null;
    const [lng, lat] = String(d.geocodes[0].location).split(",").map(Number);
    if (Number.isFinite(lng) && Number.isFinite(lat)) return { lng, lat };
  } catch {
    /* 忽略，留空坐标 */
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const records = JSON.parse(readFileSync(JSON_PATH, "utf8"));
  console.log(`读取记录: ${records.length}`);

  // 已存在记录去重键集合
  const existing = await client.execute(
    'SELECT "licenseNo", "name", "address" FROM "SchoolDirectory"'
  );
  const existKeys = new Set();
  for (const row of existing.rows) {
    const k = row.licenseNo || `${row.name}|${row.address}`;
    existKeys.add(k);
  }
  console.log(`库中已有记录: ${existing.rows.length}`);

  let inserted = 0;
  let skipped = 0;
  let geocoded = 0;
  let geoFailed = 0;

  for (const rec of records) {
    const key = rec.licenseNo || `${rec.name}|${rec.address}`;
    if (existKeys.has(key)) {
      skipped++;
      continue;
    }

    let lng = null;
    let lat = null;
    const geo = await geocode(rec.address);
    if (geo) {
      lng = geo.lng;
      lat = geo.lat;
      geocoded++;
    } else {
      geoFailed++;
    }

    const now = new Date().toISOString();
    await client.execute({
      sql: `INSERT INTO "SchoolDirectory"
        ("id","name","authority","educationalContent","licenseNo","organizer",
         "legalPerson","address","contact","lng","lat","district","status","createdAt","updatedAt")
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        randomUUID(),
        rec.name,
        rec.authority ?? null,
        rec.educationalContent ?? null,
        rec.licenseNo ?? null,
        rec.organizer ?? null,
        rec.legalPerson ?? null,
        rec.address ?? null,
        rec.contact ?? null,
        lng,
        lat,
        rec.district ?? null,
        "PUBLISHED",
        now,
        now,
      ],
    });
    inserted++;

    // 高德免费 Web API QPS 限制，150ms 间隔足够宽松
    await sleep(150);
  }

  console.log("── 导入完成 ──");
  console.log(`新增: ${inserted}  跳过(已存在): ${skipped}`);
  console.log(`地理编码成功: ${geocoded}  失败/留空: ${geoFailed}`);
}

main()
  .catch((e) => {
    console.error("导入失败:", e.message);
    process.exit(1);
  })
  .finally(() => client.close());
