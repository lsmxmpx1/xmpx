// 本地诊断：用 raw @libsql/client 连生产库，复现邮箱+密码登录查询并比对密码。
// 目的：区分「密码输错 / 邮箱大小写不匹配 / 用户不存在 / 数据库查询抛异常」，
//       从而定位生产 CredentialsSignin 的真因，无需部署。
//
// 用法（PowerShell）：
//   $env:DATABASE_URL="libsql://xxxx.turso.io"
//   $env:TURSO_AUTH_TOKEN="<token>"
//   node scripts/diag_login.mjs "user@example.com" "你输入的密码"
// （密码也可通过环境变量传入，避免出现在命令行历史：）
//   $env:DIAG_PASSWORD="你输入的密码"; node scripts/diag_login.mjs "user@example.com"

import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
const token = (process.env.TURSO_AUTH_TOKEN || "").trim();
if (!url) {
  console.error("缺少 DATABASE_URL 环境变量");
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3] || process.env.DIAG_PASSWORD;
if (!email || !password) {
  console.error('用法: node scripts/diag_login.mjs "<email>" "<password>"');
  process.exit(1);
}

const client = createClient(token ? { url, authToken: token } : { url });

async function main() {
  // 1) 精确匹配（与 prisma findFirst 默认行为一致，libsql/SQLite 大小写敏感）
  let rows = await client.execute({
    sql: "SELECT id, email, password FROM User WHERE email = ?",
    args: [email],
  });

  if (rows.rows.length === 0) {
    console.log("[诊断] 精确匹配: 未找到用户", { email });
    const ci = await client.execute({
      sql: "SELECT id, email, password FROM User WHERE LOWER(email) = LOWER(?)",
      args: [email],
    });
    if (ci.rows.length > 0) {
      const u = ci.rows[0];
      console.log("[诊断] ⚠️ 大小写不敏感匹配到用户:", {
        storedEmail: u.email,
        hasPassword: !!u.password,
      });
      if (u.password) {
        const ok = await bcrypt.compare(password, u.password);
        console.log(
          "[诊断] 该用户密码比对结果:",
          ok ? "✅ 匹配（说明你登录时邮箱大小写与注册不一致，导致查不到）" : "❌ 不匹配"
        );
      }
    } else {
      console.log("[诊断] 大小写不敏感也未找到 -> 该邮箱在生产库确实未注册");
    }
    return;
  }

  const u = rows.rows[0];
  console.log("[诊断] 精确匹配到用户:", { id: u.id, hasPassword: !!u.password });
  if (!u.password) {
    console.log("[诊断] ⚠️ 该用户 password 为 NULL -> 无法用密码登录（可能是仅凭短信注册、从未设密码）");
    return;
  }
  const ok = await bcrypt.compare(password, u.password);
  console.log(
    "[诊断] 密码比对结果:",
    ok
      ? "✅ 匹配 → 密码在库里是正确的，生产 CredentialsSignin 是应用层/适配器抛异常（见 auth.ts 新日志）"
      : "❌ 不匹配 → 你这次输入的密码与库中保存的不一致（输错或记错）"
  );
}

main()
  .catch((e) => {
    console.error("[诊断] 查询抛异常（数据库/连接问题）:", e);
    process.exit(1);
  })
  .finally(() => client.close());
