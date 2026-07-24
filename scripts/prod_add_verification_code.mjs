// 生产环境一次性迁移：创建 VerificationCode 表（验证码持久化，替代内存 Map，兼容 Vercel 多实例）
// 用法（在本机，需生产 Turso 凭据）：
//   $env:DATABASE_URL="libsql://xmpx-lsmxmpx1.aws-ap-northeast-1.turso.io"
//   $env:TURSO_AUTH_TOKEN="<你的生产 Turso token>"
//   node scripts/prod_add_verification_code.mjs
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("缺少环境变量 DATABASE_URL");
  process.exit(1);
}

const db = createClient({ url, authToken: token });

const statements = [
  `CREATE TABLE IF NOT EXISTS "VerificationCode" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "target" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VerificationCode_type_target_key" ON "VerificationCode"("type", "target")`,
  `CREATE INDEX IF NOT EXISTS "VerificationCode_target_idx" ON "VerificationCode"("target")`,
];

try {
  for (const sql of statements) {
    await db.execute(sql);
  }
  console.log("[完成] VerificationCode 表已确保存在（CREATE TABLE IF NOT EXISTS）。");
} catch (e) {
  console.error("[失败] 建表出错：", e?.message || e);
  process.exit(1);
}
