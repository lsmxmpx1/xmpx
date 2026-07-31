-- ============================================================================
-- 生产 Turso 增量同步（厦门培训网 / xmpx）
-- ============================================================================
-- 用途：新增「校区 Campus」表，支持一个机构拥有多个校区（独立地址/电话/图片/经纬度）。
--
-- 背景：本次相对上次生产同步（add_article_views.sql）的唯一变更 = 新增 Campus 表。
--       其余表/字段在生产库均已存在，无需改动。
--
-- ⚠️ 重要警告：
--   切勿使用 `prisma migrate diff --from-empty --to-schema ...` 生成的「完整重建 SQL」
--   灌入生产库——那些脚本会对所有表做 DROP TABLE 再重建，会清空生产数据！
--   本文件只做【新建一张表 + 两个索引】，是安全的最小变更。
--
-- 执行方式（在你本机，二选一）：
--   A) 用 Turso CLI（在 CMD/命令提示符下，PowerShell 不支持 `<` 重定向）：
--        turso db shell xmpx-prod < migrations\production\add_campus.sql
--   B) 用 Turso 网页控制台 Editor（console.turso.tech）粘贴下方语句直接执行。
--
-- 幂等：SQLite 不支持 CREATE TABLE IF NOT EXISTS 之外的保护；本语句执行一次即可。
--       若重复执行报 "table Campus already exists" 属正常，可忽略。
-- ============================================================================

CREATE TABLE "Campus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "district" TEXT,
    "phone" TEXT,
    "images" TEXT,
    "lng" REAL,
    "lat" REAL,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Campus_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Campus_institutionId_idx" ON "Campus"("institutionId");
CREATE INDEX "Campus_district_idx" ON "Campus"("district");
