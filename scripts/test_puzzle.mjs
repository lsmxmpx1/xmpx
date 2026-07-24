import sharp from "sharp";
import { writeFileSync } from "fs";

const W = 280, H = 160, PIECE_W = 44, PIECE_H = 44;
function randInt(m) { return Math.floor(Math.random() * m); }
function rand(a,b) { return a + Math.random()*(b-a); }

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

const colors = ["#667eea","#764ba2","#f093fb","#f5576c","#4facfe","#00f2fe","#43e97b","#38f9d9","#fa709b","#fee140","#eb3349","#f45c43","#ff512f"];
const c1 = colors[randInt(colors.length)], c2 = colors[randInt(colors.length)];
const correctX = randInt(W-PIECE_W-40)+20;
const pieceY = randInt(H-PIECE_H-40)+20;

// Background
const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
</linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/></svg>`;
const bgBase = await sharp(Buffer.from(bgSvg)).png().toBuffer();

// Hole
const holeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs><mask id="holeMask"><rect width="${W}" height="${H}" fill="white"/>
<path d="${puzzlePath()}" transform="translate(${correctX},${pieceY})" fill="black"/></mask>
<filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.4"/></filter></defs>
<path d="${puzzlePath()}" transform="translate(${correctX},${pieceY})" fill="none" stroke="#000" stroke-width="2" opacity="0.35" filter="url(#shadow)"/>
<rect width="${W}" height="${H}" fill="rgba(0,0,0,0.35)" mask="url(#holeMask)"/></svg>`;
const bgWithHole = await sharp(bgBase).composite([{input: Buffer.from(holeSvg), blend: "over"}]).png().toBuffer();

// Piece (simplified: crop + overlay)
const cropped = await sharp(bgBase).extract({left: Math.round(correctX), top: Math.round(pieceY), width: PIECE_W, height: PIECE_H}).png().toBuffer();
const overlaySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PIECE_W}" height="${PIECE_H}">
<defs><filter id="ps"><feDropShadow dx="1" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.3"/></filter></defs>
<rect width="${PIECE_W}" height="${PIECE_H}" fill="rgba(255,255,255,0.35)" rx="3"/>
<path d="${puzzlePath()}" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2" filter="url(#ps)"/>
<path d="${puzzlePath()}" fill="rgba(0,0,0,0.08)"/></svg>`;

const piece = await sharp(cropped).composite([{input: Buffer.from(overlaySvg), blend: "over"}]).png().toBuffer();

writeFileSync("scripts/test_bg.png", bgWithHole);
writeFileSync("scripts/test_piece.png", piece);
console.log("✓ BG:", bgWithHole.length, "bytes | Piece:", piece.length, "bytes");
console.log("Correct X:", correctX, "Piece Y:", pieceY);
