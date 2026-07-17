import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const baseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

  // libsql 要求把 authToken 作为 URL 的 query 参数（?authToken=...）。
  // 这里兼容「token 单独放在 TURSO_AUTH_TOKEN 环境变量」的写法，
  // 避免把一长串 token 拼进 DATABASE_URL 时出错（Vercel 报 401 的常见原因）。
  let url = baseUrl;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (authToken && !/[?&]authToken=/.test(url)) {
    url += (url.includes("?") ? "&" : "?") + "authToken=" + encodeURIComponent(authToken);
  }

  const adapter = new PrismaLibSql({ url });
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
