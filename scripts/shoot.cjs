// 截图脚本：用 playwright-core 驱动系统 Chrome，登录演示账号截取后台真实界面。
// 运行（需先启动 dev server 于 localhost:3000）：
//   node scripts/shoot.cjs
const { chromium } = require("C:/Users/admin/.workbuddy/binaries/node/workspace/node_modules/playwright-core");
const fs = require("fs");
const path = require("path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3000";
const OUT = path.join(__dirname, "..", "public", "guide");
fs.mkdirSync(OUT, { recursive: true });

const ORG = { email: "demo-jigou@xmpx.cn", password: "Xmpx@123456" };
const TCH = { email: "demo-laoshi@xmpx.cn", password: "Xmpx@123456" };

async function login(page, cred) {
  await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });
  await page.fill('input[placeholder="请输入邮箱"]', cred.email);
  await page.fill('input[placeholder="请输入密码"]', cred.password);
  await page.click('button[type="submit"]');
  // 等待会话 cookie 写入（不依赖客户端路由跳转），最多 20s
  try {
    await page.waitForFunction(
      () => /authjs\.session-token/i.test(document.cookie) || !location.pathname.startsWith("/auth/login"),
      null,
      { timeout: 20000 }
    );
  } catch (e) {
    const url = page.url();
    const errCount = await page.locator("text=登录失败").count().catch(() => 0);
    const body = await page.locator("body").innerText().catch(() => "");
    console.error(`⚠️ 登录未成功 url=${url} 失败提示=${errCount} BODY=${body.slice(0, 200)}`);
    throw e;
  }
  await page.waitForTimeout(1000);
}

async function clickTab(page, text) {
  await page.locator(`button:has-text("${text}")`).first().click();
  await page.waitForTimeout(900);
}

async function shoot(page, url, file, full = true) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  const p = path.join(OUT, file);
  await page.screenshot({ path: p, fullPage: full });
  console.log("📸", file);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    // ── 机构 ──
    const ctxOrg = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const org = await ctxOrg.newPage();
    await login(org, ORG);
    // 仅 goto 一次；切 Tab 时不重新导航（否则 React 状态重置回概览）
    await org.goto(`${BASE}/dashboard/institution`, { waitUntil: "networkidle" });
    await org.waitForTimeout(800);
    await org.screenshot({ path: path.join(OUT, "org-overview.png"), fullPage: true });
    console.log("📸 org-overview.png");
    await clickTab(org, "课程管理");
    await org.screenshot({ path: path.join(OUT, "org-courses.png"), fullPage: true });
    console.log("📸 org-courses.png");
    await clickTab(org, "咨询线索");
    await org.screenshot({ path: path.join(OUT, "org-contacts.png"), fullPage: true });
    console.log("📸 org-contacts.png");
    await clickTab(org, "推广中心");
    await org.screenshot({ path: path.join(OUT, "org-ad.png"), fullPage: true });
    console.log("📸 org-ad.png");
    await shoot(org, `${BASE}/institutions/cmsixev5b000a6co4ja638zy0`, "org-public.png");
    await ctxOrg.close();

    // ── 老师 ──
    const ctxTch = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const tch = await ctxTch.newPage();
    await login(tch, TCH);
    await shoot(tch, `${BASE}/dashboard/teacher`, "teacher-dashboard.png");
    await shoot(tch, `${BASE}/teachers/cmsixevwt000w6co4xd02trlq`, "teacher-public.png");
    await ctxTch.close();

    console.log("✅ 全部截图完成 →", OUT);
  } catch (e) {
    console.error("❌ 截图失败:", e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
