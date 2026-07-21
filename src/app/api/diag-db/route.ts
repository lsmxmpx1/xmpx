// 临时诊断路由：查看 Vercel 运行时实际连接的数据库与表。
// 仅用于排查「no such table: main.Question」问题，排查完毕后删除本文件。
import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

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

  let tables: string[] = [];
  let error = "";
  try {
    const client = createClient({ url, authToken: authToken || undefined });
    const res = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    tables = res.rows.map((r: Record<string, unknown>) => String(r.name));
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    databaseUrl: maskUrl(url),
    urlHasAuthToken: url.includes("authToken"),
    tokenEnvSet: authToken.length > 0,
    tableCount: tables.length,
    hasQuestion: tables.includes("Question"),
    hasAnswer: tables.includes("Answer"),
    tables,
    error: error || null,
  });
}
