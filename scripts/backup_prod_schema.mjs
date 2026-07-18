// 备份生产 Turso 库结构（仅 DDL，不含数据）到本地临时文件
// 用法：
//   $env:DATABASE_URL="libsql://<db>.turso.io"
//   $env:TURSO_AUTH_TOKEN="<token>"
//   node scripts/backup_prod_schema.mjs [输出路径，默认 C:/Users/.../Temp/turso_backup_<时间戳>.sql]
import { writeFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("缺少环境变量：请先设置 DATABASE_URL 与 TURSO_AUTH_TOKEN");
  process.exit(1);
}

const dest =
  process.argv[2] ||
  `C:/Users/admin/AppData/Local/Temp/turso_backup_${Date.now()}.sql`;

const client = createClient({ url, authToken });
const res = await client.execute(
  "SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY type, name"
);

let out = `-- 结构备份 ${new Date().toISOString()}\n-- DB: ${url}\n-- 对象数: ${res.rows.length}\n\n`;
for (const row of res.rows) {
  out += `-- [${row.type}] ${row.name}\n${row.sql};\n\n`;
}
writeFileSync(dest, out, "utf8");
console.log(`已备份 ${res.rows.length} 个对象到 ${dest}`);
process.exit(0);
