// 补齐生产 Turso 库 Institution 表缺失的 3 个字段（schema 已加，但生产库未迁移）。
// 用法: DATABASE_URL=libsql://xxx.turso.io TURSO_AUTH_TOKEN=eyJ... node scripts/fix-institution-columns.mjs
// 幂等：先查 information_schema/PRAGMA，仅缺失时才 ALTER ADD COLUMN。
import { createClient } from "@libsql/client";

const baseUrl = process.env.DATABASE_URL;
const authToken = (process.env.TURSO_AUTH_TOKEN ?? "").trim();

if (!baseUrl) {
  console.error("缺少 DATABASE_URL 环境变量");
  process.exit(1);
}

const config = { url: baseUrl };
if (authToken) config.authToken = authToken;

const client = createClient(config);

const EXPECTED = [
  { name: "educationalContent", type: "TEXT" },
  { name: "licenseNo", type: "TEXT" },
  { name: "organizer", type: "TEXT" },
];

async function getColumns() {
  const res = await client.execute("PRAGMA table_info(Institution)");
  return new Set(res.rows.map((r) => r.name));
}

async function main() {
  let cols;
  try {
    cols = await getColumns();
  } catch (e) {
    console.error("连接/查询生产库失败:", e.message);
    process.exit(2);
  }

  console.log("生产 Institution 现有列:", [...cols].join(", "));

  let changed = false;
  for (const col of EXPECTED) {
    if (cols.has(col.name)) {
      console.log(`  ✓ ${col.name} 已存在，跳过`);
      continue;
    }
    console.log(`  + 新增 ${col.name} (${col.type})`);
    await client.execute(
      `ALTER TABLE "Institution" ADD COLUMN "${col.name}" ${col.type}`
    );
    changed = true;
  }

  // 复核
  const after = await getColumns();
  const missing = EXPECTED.filter((c) => !after.has(c.name));
  if (missing.length) {
    console.error("仍有缺失列:", missing.map((c) => c.name).join(", "));
    process.exit(3);
  }

  console.log(changed ? "✅ 已补齐 Institution 缺失字段" : "✅ Institution 字段已完整，无需变更");
}

main().catch((e) => {
  console.error("执行失败:", e);
  process.exit(99);
});
