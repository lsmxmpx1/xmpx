// 临时诊断路由：对比「裸 @libsql/client」与「真正的 Prisma 客户端」连到的库。
// 仅用于排查「no such table: main.Question」问题，排查完毕后删除本文件。
import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function maskUrl(s: string): string {
  const q = s.indexOf("?");
  return q >= 0 ? s.slice(0, q) + "?<hidden>" : s;
}

export async function GET(request: Request) {
  const t = new URL(request.url).searchParams.get("t");
  if (t !== "diag") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = process.env.DATABASE_URL ?? "";
  const authToken = (process.env.TURSO_AUTH_TOKEN ?? "").trim();

  if (!url) {
    return NextResponse.json({ error: "DATABASE_URL 为空", databaseUrl: "" });
  }

  // 1) 裸 client 测试（已验证可用）
  let rawTables: string[] = [];
  let rawError = "";
  try {
    const client = createClient({ url, authToken: authToken || undefined });
    const res = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    rawTables = res.rows.map((r: Record<string, unknown>) => String(r.name));
  } catch (e) {
    rawError = e instanceof Error ? e.message : String(e);
  }

  // 2) 真正的 Prisma 客户端测试（用和 /questions 完全相同的连接）
  let prismaQuestionCount: string | number = "未测试";
  let prismaTables: string[] = [];
  let prismaError = "";
  try {
    prismaQuestionCount = await prisma.question.count();
    const rows = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`;
    prismaTables = (rows as Array<{ name: string }>).map((r) => r.name);
  } catch (e) {
    prismaError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    databaseUrl: maskUrl(url),
    urlHasAuthToken: url.includes("authToken"),
    tokenEnvSet: authToken.length > 0,
    nodeEnv: process.env.NODE_ENV,
    rawClient: {
      tableCount: rawTables.length,
      hasQuestion: rawTables.includes("Question"),
      hasAnswer: rawTables.includes("Answer"),
      error: rawError || null,
    },
    prismaClient: {
      questionCount: prismaQuestionCount,
      tableCount: prismaTables.length,
      hasQuestion: prismaTables.includes("Question"),
      tables: prismaTables,
      error: prismaError || null,
    },
  });
}
