// 对比生产库实际表/列 与 Prisma schema 的标量字段，找出所有缺失。
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";

const baseUrl = process.env.DATABASE_URL;
const authToken = (process.env.TURSO_AUTH_TOKEN ?? "").trim();
const config = { url: baseUrl };
if (authToken) config.authToken = authToken;
const client = createClient(config);

const SCALAR_TYPES = new Set(["String", "Int", "Float", "Boolean", "DateTime", "Json", "Bytes", "Decimal", "BigInt"]);

// 解析 schema.prisma 中每个 model 的标量字段
function parseSchema(path) {
  const text = readFileSync(path, "utf8");
  const models = {};
  const modelRe = /model\s+(\w+)\s*\{([\s\S]*?)\}/g;
  let m;
  while ((m = modelRe.exec(text))) {
    const name = m[1];
    const body = m[2];
    const fields = [];
    for (const line of body.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("//") || t.startsWith("@@")) continue;
      // 形如: fieldName Type?  // 注释
      const fm = t.match(/^(\w+)\s+(\w+)(\[\])?(\?)?/);
      if (!fm) continue;
      const fName = fm[1];
      const fType = fm[2];
      if (SCALAR_TYPES.has(fType)) fields.push(fName);
      // 非标量（关系/枚举）不参与列对比
    }
    models[name] = fields;
  }
  return models;
}

async function getProdTables() {
  const res = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  const tables = {};
  for (const r of res.rows) {
    const tname = r.name;
    const ci = await client.execute(`PRAGMA table_info("${tname}")`);
    tables[tname] = new Set(ci.rows.map((x) => x.name));
  }
  return tables;
}

async function main() {
  const schemaModels = parseSchema("prisma/schema.prisma");
  const prodTables = await getProdTables();

  const prodTableNames = new Set(Object.keys(prodTables));
  let problems = 0;

  for (const [model, fields] of Object.entries(schemaModels)) {
    if (!prodTableNames.has(model)) {
      console.log(`✗ 缺失表: ${model}`);
      problems++;
      continue;
    }
    const prodCols = prodTables[model];
    const missing = fields.filter((f) => !prodCols.has(f));
    if (missing.length) {
      console.log(`✗ ${model} 缺失列: ${missing.join(", ")}`);
      problems++;
    }
  }

  // 反向：生产有但 schema 没有的表（信息性，不重要）
  const schemaNames = new Set(Object.keys(schemaModels));
  const extra = [...prodTableNames].filter((t) => !schemaNames.has(t));
  if (extra.length) console.log(`ℹ 生产多出的表(无对应 model, 多为 Prisma 内部/历史表): ${extra.join(", ")}`);

  console.log(problems === 0 ? "\n✅ 生产库与 schema 完全一致，无缺失字段" : `\n⚠ 共 ${problems} 处不一致`);
  process.exit(problems === 0 ? 0 : 4);
}

main().catch((e) => { console.error(e); process.exit(99); });
