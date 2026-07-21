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
  const authToken = (process.env.TURSO_AUTH_TOKEN ?? "").trim();
  // 若 DATABASE_URL 自身已带 authToken 参数，则原样使用（不剥离、不覆盖），
  // 否则用 TURSO_AUTH_TOKEN 拼接。避免剥离有效 token 后连到无 token 的空库
  //（表现为 no such table: main.Question）。
  const hasUrlToken = /[?&]authToken=/.test(baseUrl);
  let url = baseUrl;
  if (!hasUrlToken && authToken) {
    url += (baseUrl.includes("?") ? "&" : "?") + "authToken=" + encodeURIComponent(authToken);
  }

  const adapter = new PrismaLibSql({ url });
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
