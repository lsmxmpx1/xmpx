// 生产库机构状态回填：把后台已审批（status='ACTIVE'）的机构改为 'APPROVED'，
// 与前台/机构主后台/发布课程 API 的判断标准对齐。
// 用法（隔离 node22 + 项目 node_modules 内的 @libsql/client）：
//   export DATABASE_URL="libsql://xxx.turso.io"
//   export TURSO_AUTH_TOKEN="<token>"
//   node scripts/backfill_institution_status.mjs
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;
if (!url || !token) {
  console.error("缺少环境变量 DATABASE_URL / TURSO_AUTH_TOKEN");
  process.exit(1);
}

const client = createClient({ url, authToken: token });

const before = await client.execute(
  `SELECT status, COUNT(*) AS cnt FROM Institution GROUP BY status`
);
console.log("回填前机构状态分布：");
for (const row of before.rows) {
  console.log(`  ${row.status} = ${row.cnt}`);
}

const res = await client.execute(
  `UPDATE Institution SET status = 'APPROVED' WHERE status = 'ACTIVE'`
);
console.log(`已将 ${res.rowsAffected ?? "?"} 条 ACTIVE 机构改为 APPROVED`);

const after = await client.execute(
  `SELECT status, COUNT(*) AS cnt FROM Institution GROUP BY status`
);
console.log("回填后机构状态分布：");
for (const row of after.rows) {
  console.log(`  ${row.status} = ${row.cnt}`);
}

console.log("BACKFILL_DONE");
