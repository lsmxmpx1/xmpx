// 生产环境一次性迁移：创建 EmailConfig 表（用于后台配置 SMTP 邮件服务器）
// 用法（在本机，需生产 Turso 凭据）：
//   $env:DATABASE_URL="libsql://xmpx-lsmxmpx1.aws-ap-northeast-1.turso.io"
//   $env:TURSO_AUTH_TOKEN="<你的生产 Turso token>"
//   node scripts/prod_add_email_config.mjs
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("缺少环境变量 DATABASE_URL");
  process.exit(1);
}

const db = createClient({ url, authToken: token });

const sql = `CREATE TABLE IF NOT EXISTS "EmailConfig" (
  "id" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "host" TEXT,
  "port" INTEGER NOT NULL DEFAULT 465,
  "secure" BOOLEAN NOT NULL DEFAULT true,
  "user" TEXT,
  "pass" TEXT,
  "from" TEXT,
  "updatedAt" DATETIME NOT NULL,
  PRIMARY KEY ("id")
);`;

try {
  await db.execute(sql);
  console.log("[完成] EmailConfig 表已确保存在（CREATE TABLE IF NOT EXISTS）。");
} catch (e) {
  console.error("[失败] 建表出错：", e?.message || e);
  process.exit(1);
}
