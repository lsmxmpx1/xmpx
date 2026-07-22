// 生产 Turso 库：为后台管理相关模型补充 createdAt / updatedAt 时间字段。
// 用法（在 xiamenpeixun 目录下，用隔离 node22 运行）：
//   $env:DATABASE_URL="libsql://<你的db>.turso.io"
//   $env:TURSO_AUTH_TOKEN="<你的token>"
//   & "C:/Users/admin/.workbuddy/binaries/node/versions/22.22.2/node.exe" scripts/prod_add_time_fields.mjs
//
// 说明：
// - 凭据从环境变量读取，不写死、不落盘。
// - 幂等：通过 PRAGMA table_info 检测列是否已存在，已存在则跳过 ALTER。
// - 历史数据回填：有 createdAt 的表，把 updatedAt 同步为 createdAt；
//   Category 两者在 ADD 时统一填当前时间（近似首次创建，两时间一致）。
// - 仅做「新增列 + 回填」，不改动/删除既有数据，可安全重跑。

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

async function addColumn(table, column, type, def) {
  if (await hasColumn(table, column)) {
    console.log(`  · 跳过 ${table}.${column}（已存在）`);
    return false;
  }
  await client.execute(
    `ALTER TABLE "${table}" ADD COLUMN "${column}" ${type} NOT NULL DEFAULT ${def}`
  );
  console.log(`  + 已添加 ${table}.${column}`);
  return true;
}

const jobs = [
  // 仅缺 updatedAt（已有 createdAt）：补 updatedAt 并回填为 createdAt
  { table: "Advertisement", col: "updatedAt", type: "DATETIME", def: "CURRENT_TIMESTAMP", backfill: true },
  { table: "AdPlan", col: "updatedAt", type: "DATETIME", def: "CURRENT_TIMESTAMP", backfill: true },
  { table: "Contact", col: "updatedAt", type: "DATETIME", def: "CURRENT_TIMESTAMP", backfill: true },
  // Category 两者皆无：先加 createdAt，再加 updatedAt（均填当前时间）
  { table: "Category", col: "createdAt", type: "DATETIME", def: "CURRENT_TIMESTAMP", backfill: false },
  { table: "Category", col: "updatedAt", type: "DATETIME", def: "CURRENT_TIMESTAMP", backfill: false },
];

console.log(`连接 ${url}\n开始补充时间字段...\n`);

for (const j of jobs) {
  const added = await addColumn(j.table, j.col, j.type, j.def);
  if (added && j.backfill && j.col === "updatedAt" && (await hasColumn(j.table, "createdAt"))) {
    await client.execute(
      `UPDATE "${j.table}" SET "${j.col}" = "createdAt" WHERE "createdAt" IS NOT NULL`
    );
    console.log(`  ↺ 已回填 ${j.table}.${j.col} <- createdAt`);
  }
}

console.log("\n完成：时间字段补充结束（可安全重跑）。");
process.exit(0);
