// 在生产 Turso 库执行 SQL 迁移脚本（@libsql/client）
// 用法（在 xiamenpeixun 目录下，用隔离 node22 运行）：
//   $env:DATABASE_URL="libsql://<你的db>.turso.io"
//   $env:TURSO_AUTH_TOKEN="<你的token>"
//   & "C:/Users/admin/.workbuddy/binaries/node/versions/22.22.2/node.exe" scripts/run_prod_sql.mjs <相对或绝对SQL路径>
//
// 说明：
// - 凭据从环境变量读取，不写死、不落盘。
// - 仅执行传入的 SQL 文件；语句按 ";" 切分，自动跳过注释与空语句。
// - 只用于「纯新增表/列/索引」的迁移，勿用于会改动/删除既有数据的语句。

import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const sqlFile = process.argv[2];

if (!url || !authToken) {
  console.error("缺少环境变量：请先设置 DATABASE_URL 与 TURSO_AUTH_TOKEN");
  process.exit(1);
}
if (!sqlFile) {
  console.error("用法：node scripts/run_prod_sql.mjs <SQL文件路径>");
  process.exit(1);
}

const client = createClient({ url, authToken });

// 读取并预处理 SQL：去除 -- 行注释，按 ";" 切分
const raw = readFileSync(sqlFile, "utf8");
const statements = raw
  .split("\n")
  .map((line) => line.replace(/--.*$/g, "")) // 去掉行内/行尾注释
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log(`连接 ${url}`);
console.log(`待执行语句数：${statements.length}\n`);

let ok = 0;
for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];
  try {
    await client.execute(stmt);
    ok++;
    console.log(`  [${i + 1}/${statements.length}] OK  ${stmt.slice(0, 60).replace(/\s+/g, " ")}...`);
  } catch (e) {
    console.error(`  [${i + 1}/${statements.length}] FAIL ${stmt.slice(0, 60).replace(/\s+/g, " ")}`);
    console.error("  错误：", e.message);
    process.exit(2);
  }
}

console.log(`\n完成：成功 ${ok}/${statements.length} 条语句。`);
process.exit(0);
