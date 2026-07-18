-- ============================================================
-- 「找老师」栏目 + 三角色用户中心 —— Turso 生产库迁移脚本
-- 仅新增：User.roles 列 + Teacher / TeacherEmployment / TeacherReview 三表 + 索引
-- 不修改任何既有表结构，可安全在生产库执行
-- 执行方式：turso db shell <your-db> < schema_teachers.sql
-- ============================================================

-- 1) User 表新增 roles 列（多身份，逗号分隔字符串，默认仅学员）
ALTER TABLE "User" ADD COLUMN "roles" TEXT NOT NULL DEFAULT 'USER';

-- 2) 老师档案表
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "bio" TEXT,
    "expertise" TEXT,
    "avatar" TEXT,
    "district" TEXT,
    "currentInstitutionId" TEXT,
    "slug" TEXT NOT NULL,
    "rating" REAL NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Teacher_currentInstitutionId_fkey" FOREIGN KEY ("currentInstitutionId") REFERENCES "Institution" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 3) 老师任职履历表
CREATE TABLE "TeacherEmployment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "title" TEXT,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeacherEmployment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeacherEmployment_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4) 老师评价表
CREATE TABLE "TeacherReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rating" INTEGER NOT NULL,
    "content" TEXT,
    "userId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RESOLVED',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "adminReply" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeacherReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeacherReview_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5) 索引
CREATE UNIQUE INDEX "Teacher_userId_key" ON "Teacher"("userId");
CREATE UNIQUE INDEX "Teacher_slug_key" ON "Teacher"("slug");
CREATE INDEX "Teacher_district_idx" ON "Teacher"("district");
CREATE INDEX "Teacher_status_idx" ON "Teacher"("status");
CREATE INDEX "Teacher_rating_idx" ON "Teacher"("rating");
CREATE INDEX "TeacherEmployment_teacherId_idx" ON "TeacherEmployment"("teacherId");
CREATE INDEX "TeacherEmployment_institutionId_idx" ON "TeacherEmployment"("institutionId");
CREATE INDEX "TeacherReview_teacherId_idx" ON "TeacherReview"("teacherId");
CREATE INDEX "TeacherReview_userId_idx" ON "TeacherReview"("userId");
CREATE INDEX "TeacherReview_status_idx" ON "TeacherReview"("status");
