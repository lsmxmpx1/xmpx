// 把 BaiduPushLog 表同步到生产 Turso 数据库
// 用法（在本地终端执行）：
//   set TURSO_URL=libsql://xmpx-lsmxmpx1.aws-ap-northeast-1.turso.io?authToken=<你的token>
//   node scripts/apply-baidu-table.mjs
import { createClient } from "@libsql/client";

const url = process.env.TURSO_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("❌ 请先设置 TURSO_URL（生产 Turso 连接串，含 authToken）");
  process.exit(1);
}

const db = createClient({ url });

const sql = `
CREATE TABLE IF NOT EXISTS "BaiduPushLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'api',
    "urls" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "success" INTEGER NOT NULL DEFAULT 0,
    "remain" INTEGER,
    "error" TEXT,
    "response" TEXT,
    "triggeredBy" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

try {
  await db.execute(sql);
  console.log("✅ BaiduPushLog 表已创建/已存在");
  const res = await db.execute(`SELECT COUNT(*) as c FROM "BaiduPushLog"`);
  console.log("   当前行数:", res.rows[0].c);
} catch (e) {
  console.error("❌ 建表失败:", e.message);
  process.exit(1);
}
