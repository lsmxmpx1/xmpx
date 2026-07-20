-- 公众号扫码登录所需的通用键值缓存表（存储 access_token、扫码登录态）
-- 仅新增 1 张表 + 1 个索引，不动任何既有表。
-- 执行方式（二选一）：
--   1) turso db shell xmpx-lsmxmpx1 < schema_wechat_mp.sql
--   2) 隔离 node 执行脚本：node scripts/run_prod_sql.mjs schema_wechat_mp.sql

CREATE TABLE "SystemCache" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "expiresAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "SystemCache_expiresAt_idx" ON "SystemCache"("expiresAt");
