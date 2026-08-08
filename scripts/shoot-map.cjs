// 重新渲染机构/老师公开页截图，覆盖 public/guide 下原有图。
// 直接截生产环境（生产已配好高德 Key 且域名在白名单中，地图瓦片正常）
const { chromium } = require("C:/Users/admin/.workbuddy/binaries/node/workspace/node_modules/playwright-core");
const fs = require("fs");
const path = require("path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
// 本地环境（localhost 已加入高德 Key 域名白名单，地图瓦片正常加载）
const BASE = "http://localhost:3000";
const GUIDE = path.join(__dirname, "..", "public", "guide");
fs.mkdirSync(GUIDE, { recursive: true });

const TARGETS = [
  { url: `${BASE}/institutions/cmsixev5b000a6co4ja638zy0`, file: "org-public.png", hasMap: true },
  { url: `${BASE}/teachers/cmsixevwt000w6co4xd02trlq`, file: "teacher-public.png", hasMap: false },
];

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--enable-webgl",
      "--use-gl=swiftshader",
      "--ignore-gpu-blocklist",
      "--enable-gpu-rasterization",
    ],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    for (const t of TARGETS) {
      await page.goto(t.url, { waitUntil: "networkidle", timeout: 40000 });
      // 等地图容器出现（ssr:false 动态加载，可能稍慢）
      if (t.hasMap) {
        try {
          await page.waitForSelector(".amap-container, .amap-map", { timeout: 20000 });
        } catch {
          console.log("⚠️ 地图容器未在 20s 内出现");
        }
      }
      await page.waitForTimeout(8000); // 等瓦片加载充分
      if (t.hasMap) {
        const info = await page.evaluate(() => {
          const errText = Array.from(document.querySelectorAll("div")).some((d) =>
            (d.innerText || "").includes("尚未配置高德地图 Key")
          );
          const container = !!document.querySelector(".amap-container, .amap-map, canvas");
          // 检测瓦片是否真的绘制（canvas 非空 / 瓦片 div 数量）
          const tiles = document.querySelectorAll(".amap-layer img, .amap-tile, canvas").length;
          return { errText, container, tiles };
        });
        console.log(`MAP[${t.file}]:`, JSON.stringify(info));
      }
      const out = path.join(GUIDE, t.file);
      await page.screenshot({ path: out, fullPage: true });
      console.log("📸", t.file, fs.statSync(out).size, "bytes");
    }
  } catch (e) {
    console.error("❌ 截图失败:", e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
