// 生产环境一次性迁移：创建 Notification 表（统一消息中心）
// 用法（在本机，需生产 Turso 凭据）：
//   $env:DATABASE_URL="libsql://xmpx-lsmxmpx1.aws-ap-northeast-1.turso.io"
//   $env:TURSO_AUTH_TOKEN="<你的生产 Turso token>"
//   node scripts/prod_add_notification.mjs
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("缺少环境变量 DATABASE_URL");
  process.exit(1);
}

const db = createClient({ url, authToken: token });

const statements = [
  `CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "relatedType" TEXT,
  "relatedId" TEXT,
  "readAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
)`,
  `CREATE INDEX IF NOT EXISTS "Notification_recipientId_idx" ON "Notification"("recipientId")`,
  `CREATE INDEX IF NOT EXISTS "Notification_recipientId_readAt_idx" ON "Notification"("recipientId", "readAt")`,
  `CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt")`,
];

try {
  for (const sql of statements) {
    await db.execute(sql);
  }
  console.log("[完成] Notification 表已确保存在（CREATE TABLE IF NOT EXISTS）。");
} catch (e) {
  console.error("[失败] 建表出错：", e?.message || e);
  process.exit(1);
}
