// 回填生产库：把 user.role='INSTITUTION' 但 roles 未包含 INSTITUTION 的用户，
// 将 INSTITUTION 追加进逗号分隔的 roles 字段（修复「我是机构」仍显示「未开通」）。
// 用法：
//   DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/backfill_institution_roles.mjs
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;
if (!url || !token) {
  console.error("缺少环境变量 DATABASE_URL / TURSO_AUTH_TOKEN");
  process.exit(1);
}
const db = createClient({ url, authToken: token });

const ORDER = ["USER", "TEACHER", "INSTITUTION", "ADMIN"];
function rolesToString(input) {
  const arr = (Array.isArray(input) ? input : (input || "").split(","))
    .map((s) => s.trim())
    .filter(Boolean);
  const set = new Set(arr);
  set.add("USER");
  const ordered = ORDER.filter((r) => set.has(r));
  for (const r of set) if (!ordered.includes(r)) ordered.push(r);
  return ordered.join(",");
}

const users = await db.execute(
  `SELECT id, roles, "role" FROM User WHERE "role" = 'INSTITUTION'`
);
let fixed = 0;
for (const u of users.rows) {
  const current = u.roles || "USER";
  const currentRoles = current.split(",").map((s) => s.trim());
  if (currentRoles.includes("INSTITUTION")) {
    console.log(`skip   ${u.id} (roles 已含 INSTITUTION: ${current})`);
    continue;
  }
  // ★ 关键：把 INSTITUTION 追加进去（上一版漏了这一步）
  const next = rolesToString([...currentRoles, "INSTITUTION"]);
  await db.execute({
    sql: `UPDATE User SET roles = ? WHERE id = ?`,
    args: [next, u.id],
  });
  console.log(`fixed  ${u.id}: ${current} -> ${next}`);
  fixed++;
}
console.log(`\nDONE：修正 ${fixed} 条，共扫描 ${users.rows.length} 个机构主账号`);
