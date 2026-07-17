# Vercel 部署清单（xiamenpeixun）

> 适用：Next.js 14（App Router）+ Prisma 7 + libsql/Turso。
> 代码已推送到 GitHub `main`，本清单用于把项目正确跑在 Vercel 上。

---

## 0. 前置条件
- 代码已推送到 GitHub（仓库 `lsmxmpx1/xmpx` 的 `main` 分支）。
- 已拥有 Vercel 账号，并 Import 该 GitHub 仓库。

---

## 1. 准备生产数据库（Turso，SQLite 在 Vercel 不持久化）

Vercel 文件系统是只读/无状态的，`file:./dev.db` 在线上**每次部署/调用都会重置**。
务必改用 Turso（libsql 远程库），项目已依赖 `@prisma/adapter-libsql`，可直接对接。

```bash
# 1) 安装并登录 Turso CLI
curl -L https://bit.ly/install-turso | bash
turso auth login

# 2) 建库（若尚未建）
turso db create xmpx-prod

# 3) 取连接信息
turso db show xmpx-prod --url      # 形如 libsql://xxxx.turso.io
turso db tokens create xmpx-prod   # 形如 eyJh...
```

得到两个值：
- **DATABASE_URL** = `libsql://<id>.turso.io?authToken=<token>`
- 把 token 一并拼进 URL 的 `authToken` 参数里（本项目 adapter 从 `DATABASE_URL` 整体读取）。

> ⚠️ **重要（Prisma 7 + Turso 的坑）**：`prisma db push` / `prisma migrate` 等 CLI 命令**只支持本地 SQLite 连接**，
> 无法直接对远程 `libsql://` 执行（会报 `P1013: The provided database string is invalid`）。
> 所以**绝不能**在 `postinstall` 里放 `prisma db push`。远程建表请走第 4 节的「schema 同步」流程。

---

## 2. Vercel 环境变量（必填）

路径：Vercel 项目 → **Settings → Environment Variables** → 分别添加，
**Environment 全选 Production / Preview / Development**（Development 可先用本地值，生产务必用 Turso）。

| 变量名 | 值 | 说明 |
|---|---|---|
| `DATABASE_URL` | `libsql://<id>.turso.io?authToken=<token>` | 生产库地址。运行时的 Prisma adapter（`src/lib/prisma.ts`）用它连 Turso。**首部署前必须设置**，否则运行时会连库失败。 |
| `AUTH_SECRET` | 一串随机串 | Auth.js(v5) 生产环境**必需**，缺失会运行时 500。生成：`openssl rand -base64 32` 或 `npx auth secret`。 |

> 本地 `.env` 被 gitignore，Vercel 读不到它，这些变量必须手动在面板填。

---

## 3. Build / Install 设置（Vercel 项目 → Settings → Build & Output）

| 项 | 值 |
|---|---|
| Framework Preset | `Next.js` |
| Build Command | `next build`（即 `npm run build`，无需改） |
| Install Command | `npm install`（默认；会触发 `postinstall`） |
| Output Directory | `.next` |
| Node.js Version | `22.x`（与本地 22.22.2 一致） |

**`postinstall` = `prisma generate`（仅生成客户端，不连库）**。
`prisma.config.ts` 里的 `datasource.url` 已改为本地 `file:` 占位（`LOCAL_DATABASE_URL || "file:./dev.db"`），
因此 Vercel 安装阶段能顺利生成 `@/generated/prisma/client`，**不再出现 `Module not found`**，
且不会去连远程 Turso（CLI 也不支持）。

---

## 4. 远程 Turso 的建表与后续 schema 同步（关键）

CLI 不能直接 push 到 Turso，正确流程是「本地生成 SQL → 对 Turso 执行」：

### 4.1 首次建表（本项目已帮你执行过一次，库里已有 12 张表）
如需重做或对**全新空库**初始化：
```bash
# 用 Prisma 从 schema 生成建表 SQL（不连库，纯 schema→SQL）
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > schema.sql

# 方式 A：用 Turso CLI 直接灌入
turso db shell xmpx-prod < schema.sql

# 方式 B：用 libsql 客户端脚本灌入（无需装 Turso CLI）
#   TURSO_URL="libsql://<id>.turso.io?authToken=<token>" node apply-schema.mjs
```

### 4.2 以后改了 schema 要同步到线上
1. 改 `prisma/schema.prisma`。
2. 重新生成 SQL：
   ```bash
   npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > schema.sql
   ```
   （用了 `--from-empty`，所以拿到的永远是「完整建表语句」；对已有表执行时，
   用 `turso db shell` 会报 `already exists` 属正常，可加 `IF NOT EXISTS` 或仅对新增表补 SQL。）
3. 把 SQL 灌入 Turso（同上 4.1）。
4. `git push`，Vercel 重新构建（仅 `prisma generate`，无需再连库建表）。

---

## 5. 部署与验证
1. 在 Vercel 填好 `DATABASE_URL`（Turso）与 `AUTH_SECRET` 两个环境变量后，**Trigger Deploy / Redeploy**。
2. 观察 Build Logs：应看到 `✔ Generated Prisma Client`，**不应**再出现
   `Can't resolve '@/generated/prisma/client'`，也不应有 `P1013`。
3. 打开线上首页，确认广告位、前台页面正常（库里已有表与数据）。
4. 登录后台 `/admin` 做一次冒烟（广告展示、上传尺寸校验）。

---

## 6. 已知注意点
- **`public/uploads/` 已随源码提交**：当前图片能显示；上传量变大后建议改为 gitignore 并单独备份，避免仓库膨胀。
- **Prisma 7 连接串位置**：不在 `schema.prisma`，而在 `prisma.config.ts` 的 `datasource.url`（给 CLI 用，本地 `file:` 占位）+ `src/lib/prisma.ts` 的 adapter（`process.env.DATABASE_URL`，运行时连 Turso）。两者分离，互不影响。
- **本地开发**：本地 `.env` 的 `DATABASE_URL="file:./dev.db"` 仍可用，`npm install` 会 `prisma generate`；本地建表用 `npx prisma db push`（连本地文件，正常）。
- **远程 Turso 建表只能走「生成 SQL → 执行」**（见第 4 节），不可靠 `postinstall` 自动 push。
