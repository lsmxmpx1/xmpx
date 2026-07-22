// 生产 Turso 库：为后台管理相关模型补充 createdAt / updatedAt 时间字段。
// 用法（在 xiamenpeixun 目录下，用隔离 node22 运行）：
//   $env:DATABASE_URL="libsql://<你的db>.turso.io"
//   $env:TURSO_AUTH_TOKEN="<你的token>"
//   & "C:/Users/admin/.workbuddy/binaries/node/versions/22.22.2/node.exe" scripts/prod_add_time_fields.mjs
//
// 说明：
// - 凭据从环境变量读取，不写死、不落盘。
// - 幂等：通过 PRAGMA table_info 检测列是否已存在，已存在则跳过 ALTER。
// - 加列策略：SQLite/libsql 不允许在「已有数据的表」上加 NOT NULL DEFAULT CURRENT_TIMESTAMP
//   （CURRENT_TIMESTAMP 被视为非恒定默认值，报 Cannot add a column with non-constant default）。
//   因此先加「可空列、不带默认值」，再用 UPDATE 回填，最后用 CURRENT_TIMESTAMP 兜底空值。
// - 回填只写 NULL 行（WHERE col IS NULL），不会覆盖已存在的真实 updatedAt，可安全重跑。
// - 列在库中保持可空；Prisma 的 @updatedAt / @default(now()) 会对新行始终写入值，
//   且历史行已全部回填，运行时不会出现 NULL。

import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("缺少环境变量：请先设置 DATABASE_URL 与 TURSO_AUTH_TOKEN");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function hasColumn(table, column) {
  const res = await client.execute(`PRAGMA table_info("${table}")`);
  return res.rows.some((r) => r.name === column);
}

// 加「可空列、不带默认值」——无论表是否为空都安全。
async function addColumnNullable(table, column) {
  if (await hasColumn(table, column)) {
    console.log(`  · 跳过 ${table}.${column}（已存在）`);
    return false;
  }
  await client.execute(`ALTER TABLE "${table}" ADD COLUMN "${column}" DATETIME`);
  console.log(`  + 已添加 ${table}.${column}（可空，稍后回填）`);
  return true;
}

// 把 col 回填为 source（仅填充 col 为 NULL 的行）；余下 NULL 用当前时间兜底。
async function backfillFrom(table, column, source) {
  await client.execute(
    `UPDATE "${table}" SET "${column}" = "${source}" WHERE "${column}" IS NULL AND "${source}" IS NOT NULL`
  );
  await client.execute(
    `UPDATE "${table}" SET "${column}" = CURRENT_TIMESTAMP WHERE "${column}" IS NULL`
  );
  const res = await client.execute(`SELECT COUNT(*) AS n FROM "${table}" WHERE "${column}" IS NULL`);
  const remain = res.rows[0]?.n ?? 0;
  console.log(`  ↺ 已回填 ${table}.${column}（来源 ${source}；剩余 NULL: ${remain}）`);
}

// 把 col 用当前时间兜底（仅填充 NULL 行）。
async function backfillCurrent(table, column) {
  await client.execute(
    `UPDATE "${table}" SET "${column}" = CURRENT_TIMESTAMP WHERE "${column}" IS NULL`
  );
  const res = await client.execute(`SELECT COUNT(*) AS n FROM "${table}" WHERE "${column}" IS NULL`);
  const remain = res.rows[0]?.n ?? 0;
  console.log(`  ↺ 已回填 ${table}.${column}（填当前时间；剩余 NULL: ${remain}）`);
}

const jobs = [
  // 仅缺 updatedAt（已有 createdAt）：补 updatedAt，回填为 createdAt
  { table: "Advertisement", col: "updatedAt", source: "createdAt" },
  { table: "AdPlan", col: "updatedAt", source: "createdAt" },
  { table: "Contact", col: "updatedAt", source: "createdAt" },
  // Category 两者皆无：先加 createdAt，再加 updatedAt（均填当前时间）
  { table: "Category", col: "createdAt", source: null },
  { table: "Category", col: "updatedAt", source: null },
];

console.log(`连接 ${url}\n开始补充时间字段...\n`);

for (const j of jobs) {
  await addColumnNullable(j.table, j.col);
  // 无论是否刚加，都执行回填（幂等：只写 NULL 行，不覆盖真实值）
  if (j.source) {
    await backfillFrom(j.table, j.col, j.source);
  } else {
    await backfillCurrent(j.table, j.col);
  }
}

console.log("\n完成：时间字段补充结束（列在库中可空，已全量回填，可安全重跑）。");
process.exit(0);
