import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import "dotenv/config";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const client = createClient({ url });

const EMAIL = "admin@xmpx.cn";
const PASSWORD = process.env.ADMIN_PASSWORD || "XmpxAdmin2026";

const existing = await client.execute({
  sql: "SELECT id, role FROM User WHERE email = ?",
  args: [EMAIL],
});

if (existing.rows.length > 0) {
  const row = existing.rows[0];
  console.log(`管理员账号已存在: ${EMAIL} (role=${row.role})`);
  if (row.role !== "ADMIN") {
    await client.execute({
      sql: "UPDATE User SET role = 'ADMIN' WHERE email = ?",
      args: [EMAIL],
    });
    console.log("已将角色更新为 ADMIN");
  }
  process.exit(0);
}

const hash = bcrypt.hashSync(PASSWORD, 12);
const id = crypto.randomUUID();

await client.execute({
  sql: "INSERT INTO User (id, name, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'ADMIN', datetime('now'), datetime('now'))",
  args: [id, "超级管理员", EMAIL, hash],
});

console.log("✅ 管理员账号创建成功");
console.log(`   邮箱: ${EMAIL}`);
console.log(`   密码: ${PASSWORD}`);
console.log("   后台地址: /admin");
process.exit(0);
