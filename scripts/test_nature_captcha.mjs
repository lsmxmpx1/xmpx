import sharp from "sharp";
import { writeFileSync } from "fs";

// 复制 route.ts 中的核心函数来测试
const W = 280, H = 160, PIECE_W = 44, PIECE_H = 44;
function randInt(m) { return Math.floor(Math.random() * m); }
function rand(a,b) { return a + Math.random()*(b-a); }

const NATURE_THEMES = [
  "forest", "ocean", "sky", "desert", "mountain", "beach",
  "sunset", "lake", "waterfall", "field", "clouds", "aurora",
];

const UNSPLASH_IDS = [
  "1470071459108-fbf675a7a2c4", "1473493598085-07e350d92927",
  "1441974231531-c6257fd6c56f", "1469474968028-56623f02e42e",
  "1433086961670-e5cefea80e0", "1426604966841-d7999f5f17f7",
  "1518837678942-9b2a7b55409b", "1497430105542-1990fe52bb57",
  "1483728642383-d7ba89bcc95a", "1506748686132-79eb7a4569a3",
  "1523712999592-e1d01c78606c", "1531368936443-84abf6aa7c28",
  "1542273917363-d425bc49bd96", "1551247534770-98e38d8b05de",
  "1560493676792-c5113e9faea8", "1573165151938-3b5a4d8c6d9e",
  "1586347743351-11986dd0f817", "1593062154323-ef5da6c4efa4",
  "1600585030464-00b2c93b1ae4", "1611260374527-ff2b4b4f4d9c",
  "1625242256934-4009444e4216", "1634012666064-79e2e1082fc8",
  "1644165551673-4dc74b90072f", "1654604953388-4f9d1085c265",
  "1667005122566-abfde3acfa6a", "1678855816703-14edcb4cfd5d",
  "1689749369865-5cad0cbf5f2e", "1697216526318-cf9ed6be4cc8",
  "1707181098792-e025c7a4ffd6", "1717747062221-10fb02be2513",
  "1726873124189-0919aa93f955", "1736424483026-850a59df9adb",
  "1744040752133-4f0852cb54ac", "1751459348226-1ff44642cfff",
  "1761073432506-bc5f6bf6d34d", "1770842492436-b60acaf7ca12",
  "1781101181666-a24b79e50cb2", "1791212477812-cd946228c29a",
  "1801173918265-334358e0dae3", "1811134902731-91b64fed1a51",
  "1821102161176-002b3f8db807", "1831053031139-0152098c8e9b",
  "1841089936995-8b130857a0fe", "1851116406208-0609a1adcd71",
  "1861145151202-1830e68184da", "1871175201166-7920c6fc82e1",
  "1881205251237-8c94a16f8d3f", "1891235301307-9d5b6e7a8e4d",
  "1901265351378-0e6c7f9a9f5e", "1911295401449-1f7d8b2a0c6f",
  "1921325451520-2a8e9c3b1d70", "1931355501591-3b9a4d4c2e81",
  "1941385551662-4c0b5e5d3f92", "1951415601735-5d1c6e6e4f03",
  "1961445651808-6e2d7f7f0a14", "1971475701881-7f3e8g8g1a25",
];

function puzzlePath() {
  const w=PIECE_W, h=PIECE_H, r=4, tabR=10;
  return [
    `M ${r} 0`, `L ${w*0.5-tabR} 0`, `Q ${w*0.5} ${-tabR*0.8} ${w*0.5+tabR} 0`,
    `L ${w-r} 0`, `Q ${w} 0 ${w} ${r}`, `L ${w} ${h*0.45-tabR*0.3}`,
    `Q ${w+tabR*0.6} ${h*0.45} ${w} ${h*0.45+tabR*0.3}`, `L ${w} ${h-r}`,
    `Q ${w} ${h} ${w-r} ${h}`, `L ${r} ${h}`, `Q 0 ${h} 0 ${h-r}`,
    `L 0 ${r}`, `Q 0 0 ${r} 0`, "Z"
  ].join(" ");
}

async function testGenerate() {
  const theme = NATURE_THEMES[randInt(NATURE_THEMES.length)];
  const id = UNSPLASH_IDS[randInt(UNSPLASH_IDS.length)];
  const url = `https://images.unsplash.com/photo-${id}?w=${W}&h=${H}&fit=crop&q=80&auto=format`;
  
  console.log(`Fetching: theme=${theme}, id=${id}`);
  console.log(`URL: ${url}`);
  
  let rawBg;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { "Accept": "image/*" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get("content-type");
    console.log("Content-Type:", ct);
    rawBg = Buffer.from(await res.arrayBuffer());
    console.log("Image size:", rawBg.length, "bytes");
    
    if (rawBg.length < 1024) throw new Error("Too small");
  } catch (e) {
    console.error("Unsplash failed:", e.message);
    process.exit(1);
  }

  // Resize
  const bgBase = await sharp(rawBg).resize(W, H, { fit: "cover", position: "center" }).ensureAlpha().png().toBuffer();
  console.log("Resized BG:", bgBase.length, "bytes");

  const correctX = randInt(W - PIECE_W - 40) + 20;
  const pieceY = randInt(H - PIECE_H - 40) + 20;

  // Hole overlay
  const holeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <mask id="holeMask"><rect width="${W}" height="${H}" fill="white"/>
      <path d="${puzzlePath()}" transform="translate(${correctX},${pieceY})" fill="black"/></mask>
      <filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="0.5"/></filter>
    </defs>
    <path d="${puzzlePath()}" transform="translate(${correctX},${pieceY})" fill="none" stroke="#000" stroke-width="2.5" opacity="0.4" filter="url(#shadow)"/>
    <rect width="${W}" height="${H}" fill="rgba(0,0,0,0.4)" mask="url(#holeMask)"/>
    <path d="${puzzlePath()}" transform="translate(${correctX},${pieceY})" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
  </svg>`;

  const bgWithHole = await sharp(bgBase).composite([{input: Buffer.from(holeSvg), blend:"over"}]).png().toBuffer();
  console.log("BG with hole:", bgWithHole.length, "bytes");

  // Piece
  const cropped = await sharp(bgBase).extract({left: Math.round(correctX), top: Math.round(pieceY), width: PIECE_W, height: PIECE_H}).png().toBuffer();
  
  const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PIECE_W}" height="${PIECE_H}">
    <defs><clipPath id="pc"><path d="${puzzlePath()}"/></clipPath></defs>
    <rect width="${PIECE_W}" height="${PIECE_H}" fill="white"/></svg>`;
  const strokeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PIECE_W}" height="${PIECE_H}">
    <defs><filter id="ps"><feDropShadow dx="1" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.35"/></filter></defs>
    <path d="${puzzlePath()}" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2.5" filter="url(#ps)" stroke-linejoin="round"/></svg>`;

  const piece = await sharp(cropped).ensureAlpha()
    .composite([{input:Buffer.from(maskSvg), blend:"in"}, {input:Buffer.from(strokeSvg), blend:"over"}])
    .png().toBuffer();
  console.log("Piece:", piece.length, "bytes");

  writeFileSync("scripts/test_nature_bg.png", bgWithHole);
  writeFileSync("scripts/test_nature_piece.png", piece);
  console.log("\n✓ Saved to scripts/test_nature_bg.png & test_nature_piece.png");
}

testGenerate().catch(e => { console.error(e); process.exit(1); });
