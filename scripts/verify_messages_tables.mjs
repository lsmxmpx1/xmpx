// 验证生产 Turso 库是否已有 Conversation / Message 两表
// 用法：
//   $env:DATABASE_URL="libsql://<db>.turso.io"
//   $env:TURSO_AUTH_TOKEN="<token>"
//   node scripts/verify_messages_tables.mjs
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("缺少环境变量：请先设置 DATABASE_URL 与 TURSO_AUTH_TOKEN");
  process.exit(1);
}

const client = createClient({ url, authToken });
const res = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('Conversation','Message') ORDER BY name"
);
const names = res.rows.map((r) => r.name);
console.log("Conversation/Message 表存在情况：", names);
if (names.length === 2) {
  console.log("VERIFY_OK");
  process.exit(0);
} else {
  console.log("VERIFY_FAIL（缺少表）");
  process.exit(3);
}
