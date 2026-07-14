# Vercel 部署清单（xiamenpeixun）

> 适用：Next.js 14（App Router）+ Prisma 7 + libsql/SQLite(Turso)。
> 代码已推送到 GitHub `main`，本清单用于把项目正确跑在 Vercel 上。

---

## 0. 前置条件
- 代码已推送到 GitHub（仓库 `lsmxmpx1/xmpx` 的 `main` 分支）。
- 已拥有 Vercel 账号，并 Import 该 GitHub 仓库。

---

## 1. 准备生产数据库（推荐 Turso，SQLite 在 Vercel 不持久化）

Vercel 文件系统是只读/无状态的，`file:./dev.db` 在线上**每次部署/调用都会重置**。
务必改用 Turso（libsql 远程库），项目已依赖 `@prisma/adapter-libsql`，可直接对接。

```bash
# 1) 登录/注册 Turso
curl -L https://bit.ly/install-turso | bash
turso auth login

# 2) 建库
turso db create xmpx-prod

# 3) 取连接信息
turso db show xmpx-prod --url      # 形如 libsql://xxxx.turso.io
turso db tokens create xmpx-prod   # 形如 eyJh...
```

得到两个值：
- **DATABASE_URL** = `libsql://<id>.turso.io?authToken=<token>`
- 把 token 一并拼进 URL 的 `authToken` 参数里（本项目 adapter 从 `DATABASE_URL` 整体读取）。

---

## 2. Vercel 环境变量（必填）

路径：Vercel 项目 → **Settings → Environment Variables** → 分别添加，
**Environment 全选 Production / Preview / Development**（Development 可先用本地值，生产务必用 Turso）。

| 变量名 | 值 | 说明 |
|---|---|---|
| `DATABASE_URL` | `libsql://<id>.turso.io?authToken=<token>` | 生产库地址。**首部署前就必须设置**，否则 `postinstall` 里的 `prisma db push` 会因连不上库而失败。 |
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

**自动同步表结构**：`package.json` 的 `postinstall` 已设为
`prisma generate && prisma db push`，所以每次安装依赖时会：
1. 生成 Prisma 客户端（修复 `Module not found: @/generated/prisma/client`）；
2. 把 schema 推送到 `DATABASE_URL` 指向的库（首次即建好线上表）。

---

## 4. 部署与验证

1. 在 Vercel 填好上面 2 个环境变量后，**Trigger Deploy / Redeploy**。
2. 观察 Build Logs：
   - 应看到 `✔ Generated Prisma Client` 与 `Prisma db push` 成功信息。
   - 不应再出现 `Can't resolve '@/generated/prisma/client'`。
3. 打开线上首页，确认广告位、前台页面正常。
4. 登录后台 `/admin` 做一次冒烟（广告展示、上传尺寸校验）。

---

## 5. 已知注意点
- **`public/uploads/` 已随源码提交**：当前图片能显示；上传量变大后建议改为 gitignore 并单独备份，避免仓库膨胀。
- **`postinstall` 依赖 `DATABASE_URL`**：务必在第 2 步先设好变量再部署；若忘记设置，安装阶段 `prisma db push` 失败会导致整个构建失败（不是 500，而是构建红）。
- **Prisma 7 连接串位置**：不在 `schema.prisma`，而在 `prisma.config.ts` 的 `datasource.url` 与 `src/lib/prisma.ts` 的 adapter；已通过 `DATABASE_URL` 驱动，无需改 schema。
- **本地开发**：本地 `.env` 的 `DATABASE_URL="file:./dev.db"` 仍可用，`npm install` 本地会 `db push` 到本地库（无害）。
