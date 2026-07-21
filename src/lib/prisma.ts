import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const baseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const authToken = (process.env.TURSO_AUTH_TOKEN ?? "").trim();

  // PrismaLibSql 会把 config 原样透传给 @libsql/client 的 createClient，
  // 而 createClient 接受「url + 独立 authToken 字段」。诊断 API 已验证该写法
  // 能正确连到生产库并读到 Question/Answer 表，因此这里与之一致：
  // URL 保持干净（不带 token），token 作为独立字段传入。
  // 之前把 token 拼进 URL 的 ?authToken= 写法在 Vercel 上会连到无 token 的
  // 空库，表现为 no such table: main.Question。
  const config: { url: string; authToken?: string } = { url: baseUrl };
  if (authToken) {
    config.authToken = authToken;
  }

  const adapter = new PrismaLibSql(config);
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
