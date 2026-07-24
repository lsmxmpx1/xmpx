import sharp from "sharp";
import { readFileSync, writeFileSync, rmSync } from "node:fs";

const svg = readFileSync("public/favicon.svg");

// 生成 PNG 各尺寸
const sizes = [16, 32, 48, 180, 192, 512];
for (const s of sizes) {
  await sharp(svg, { density: 384 })
    .resize(s, s, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(`public/favicon-${s}.png`);
  console.log(`  ✓ public/favicon-${s}.png`);
}

// apple-touch-icon 用 180
await sharp(svg, { density: 384 })
  .resize(180, 180, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .png()
  .toFile("public/apple-touch-icon.png");
console.log("  ✓ public/apple-touch-icon.png");

// 生成 .ico（含 16/32/48 三档）
await sharp(svg, { density: 384 })
  .resize(48, 48, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toFile("public/favicon.ico");
console.log("  ✓ public/favicon.ico");

// 删除 src/app 下的默认 favicon.ico，避免与 public 重复产生冲突
try { rmSync("src/app/favicon.ico"); console.log("  ✓ 已删除 src/app/favicon.ico（Next 默认图标）"); }
catch (e) { console.log("  (src/app/favicon.ico 无需删除或不存在)"); }

console.log("完成。");
