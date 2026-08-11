-- ============================================================
-- 厦门培训网 · Feedback 表新增「游客匿名留言」字段
-- 目标库：生产 Turso / libsql（xmpx-prod）
-- 执行方式（二选一）：
--   1) Turso CLI： turso db shell xmpx-prod < prisma/alter_feedback_guest.sql
--   2) libsql 客户端 / 平台 SQL 控制台直接粘贴执行
-- 说明：全部为新增可空列 + 一个带默认值的布尔列，不会破坏现有数据。
-- ============================================================

-- 游客标记（true=未登录匿名留言）
ALTER TABLE "Feedback" ADD COLUMN "isGuest" BOOLEAN NOT NULL DEFAULT false;

-- 匿名留言者 IP（来自 x-forwarded-for，取首个；本地开发为"本地"）
ALTER TABLE "Feedback" ADD COLUMN "ipAddress" TEXT;

-- 匿名留言者国家（中文名，来自 x-vercel-ip-country）
ALTER TABLE "Feedback" ADD COLUMN "ipCountry" TEXT;

-- 匿名留言者城市（来自 x-vercel-ip-city）
ALTER TABLE "Feedback" ADD COLUMN "ipCity" TEXT;
