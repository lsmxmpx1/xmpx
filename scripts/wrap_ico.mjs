import { readFileSync, writeFileSync } from "node:fs";

// 把 PNG 包装成标准 .ico 容器（支持多分辨率）
const pngPaths = ["public/favicon-16.png", "public/favicon-32.png", "public/favicon-48.png"];
const images = pngPaths.map((p) => ({ png: readFileSync(p), size: p.match(/(\d+)/)[1] | 0 }));

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);        // reserved
header.writeUInt16LE(1, 2);        // type = icon
header.writeUInt16LE(images.length, 4);

const entries = Buffer.alloc(images.length * 16);
const datas = [];
let offset = 6 + images.length * 16;

images.forEach((img, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(img.size >= 256 ? 0 : img.size, 0); // width (0 means 256)
  e.writeUInt8(img.size >= 256 ? 0 : img.size, 1); // height
  e.writeUInt8(0, 2);                              // color count (0 = >256)
  e.writeUInt8(0, 3);                              // reserved
  e.writeUInt16LE(1, 4);                           // planes
  e.writeUInt16LE(32, 6);                          // bit count
  e.writeUInt32LE(img.png.length, 8);              // bytes in resource
  e.writeUInt32LE(offset, 12);                     // offset
  entries.set(e, i * 16);
  datas.push(img.png);
  offset += img.png.length;
});

const out = Buffer.concat([header, entries, ...datas]);
writeFileSync("public/favicon.ico", out);
console.log(`✓ public/favicon.ico 生成，含 ${images.length} 档分辨率，大小 ${out.length} 字节`);
