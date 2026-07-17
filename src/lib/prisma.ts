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
  // 仅当 token 真实存在（非空、非纯空白）才拼接，杜绝产生 authToken= 的空 query 参数
  const authToken = (process.env.TURSO_AUTH_TOKEN ?? "").trim();
  // 若 DATABASE_URL 自带了 authToken 参数（无论是否为空），先剥离，后面统一用 TURSO_AUTH_TOKEN 决定
  const hashIdx = url.indexOf("#");
  const base = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
  const hash = hashIdx >= 0 ? url.slice(hashIdx) : "";
  const qIdx = base.indexOf("?");
  if (qIdx >= 0) {
    const path = base.slice(0, qIdx);
    const params = base
      .slice(qIdx + 1)
      .split("&")
      .filter((p) => p && !p.startsWith("authToken="));
    url = (params.length ? path + "?" + params.join("&") : path) + hash;
  }
  if (authToken) {
    url += (url.includes("?") ? "&" : "?") + "authToken=" + encodeURIComponent(authToken);
  }

  const adapter = new PrismaLibSql({ url });
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
