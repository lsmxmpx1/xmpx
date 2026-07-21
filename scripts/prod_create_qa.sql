-- 生产 Turso 库：问答社区 Question + Answer 建表（增量，不动既有表）
-- 仅新增两张表及索引；SystemCache 表与 User.wechat* 字段因已无代码引用，保留无害，不在此删除。

CREATE TABLE IF NOT EXISTS "Question" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "isPublic" INTEGER NOT NULL DEFAULT 0,
  "adminReply" TEXT,
  "views" INTEGER NOT NULL DEFAULT 0,
  "slug" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Question_slug_key" ON "Question"("slug");
CREATE INDEX IF NOT EXISTS "Question_category_idx" ON "Question"("category");
CREATE INDEX IF NOT EXISTS "Question_status_idx" ON "Question"("status");
CREATE INDEX IF NOT EXISTS "Question_isPublic_idx" ON "Question"("isPublic");
CREATE INDEX IF NOT EXISTS "Question_createdAt_idx" ON "Question"("createdAt");

CREATE TABLE IF NOT EXISTS "Answer" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "questionId" TEXT NOT NULL,
  "authorId" TEXT,
  "authorName" TEXT,
  "content" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "isPublic" INTEGER NOT NULL DEFAULT 0,
  "isBest" INTEGER NOT NULL DEFAULT 0,
  "adminReply" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE,
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "Answer_questionId_idx" ON "Answer"("questionId");
CREATE INDEX IF NOT EXISTS "Answer_status_idx" ON "Answer"("status");
CREATE INDEX IF NOT EXISTS "Answer_isPublic_idx" ON "Answer"("isPublic");
