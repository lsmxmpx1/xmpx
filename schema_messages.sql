-- ============================================================
-- 站内私信系统 —— Turso 生产库迁移脚本
-- 仅新增：Conversation（会话） + Message（消息）两张表 + 索引
-- 不修改任何既有表结构，可安全在生产库执行
-- 执行方式：turso db shell <your-db> < schema_messages.sql
-- ============================================================

-- 1) 私信会话表
-- 一端固定为学员（studentId），另一端为老师/机构（peerType + peerUserId 均指向 User.id）
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "peerType" TEXT NOT NULL,
    "peerUserId" TEXT NOT NULL,
    "peerEntityId" TEXT,
    "subject" TEXT,
    "lastMessage" TEXT,
    "lastAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Conversation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Conversation_peerUserId_fkey" FOREIGN KEY ("peerUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 2) 私信消息表
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3) 索引
CREATE INDEX "Conversation_studentId_idx" ON "Conversation"("studentId");
CREATE INDEX "Conversation_peerUserId_idx" ON "Conversation"("peerUserId");
CREATE INDEX "Conversation_peerType_idx" ON "Conversation"("peerType");
CREATE INDEX "Conversation_lastAt_idx" ON "Conversation"("lastAt");
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");
