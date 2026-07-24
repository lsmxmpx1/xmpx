import sharp from "sharp";
import { writeFileSync } from "fs";

const W=280,H=160,PW=44,PH=44;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#4facfe"/></svg>`;
const bgBuf = await sharp(Buffer.from(svg)).png().toBuffer();

// Crop
const crop = await sharp(bgBuf).extract({left:100,top:50,width:PW,height:PH}).png().toBuffer();
writeFileSync("scripts/test_crop.png", crop);
console.log("Crop:", crop.length, "bytes");

// Simple circle mask - black bg + white circle
const mask = `<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}"><rect width="${PW}" height="${PH}" fill="black"/><circle cx="22" cy="22" r="18" fill="white"/></svg>`;

// blend "in": keep where mask is non-zero (white)
const result = await sharp(crop).ensureAlpha()
  .composite([{input:Buffer.from(mask), blend:"in"}]).png().toBuffer();
writeFileSync("scripts/test_masked.png", result);
console.log("Masked:", result.length, "bytes");
