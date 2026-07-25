import sharp from "sharp";
import { writeFileSync } from "fs";

const W = 280, H = 160, PIECE_W = 44, PIECE_H = 44;
function randInt(m) { return Math.floor(Math.random() * m); }
function rand(a,b) { return a + Math.random()*(b-a); }
function pick(arr) { return arr[randInt(arr.length)]; }

// ── Scene 1: Sky & Clouds ──
function sceneSkyClouds() {
  const skyTop = pick(["#1e90ff","#4169e1","#00bfff","#87ceeb"]);
  const skyBot = pick(["#b0e0e6","#e0f6ff","#add8e6","#f0f8ff"]);
  let clouds = "";
  for (let i=0; i<randInt(3)+2; i++) {
    const cx=rand(-30,W+10), cy=rand(5,H*0.5), sc=rand(0.6,1.4), op=(rand(0.7,0.95)).toFixed(2);
    clouds += `<g transform="translate(${cx.toFixed(1)},${cy.toFixed(1)}) scale(${sc.toFixed(2)})" opacity="${op}">
      <ellipse cx="0" cy="0" rx="28" ry="14" fill="#fff"/>
      <ellipse cx="-18" cy="3" rx="20" ry="11" fill="#fff"/>
      <ellipse cx="18" cy="2" rx="22" ry="12" fill="#fff"/>
      <ellipse cx="-8" cy="-6" rx="16" ry="9" fill="#fff"/>
      <ellipse cx="12" cy="-5" rx="18" ry="10" fill="#fff"/>
      <ellipse cx="0" cy="5" rx="24" ry="8" fill="#fff"/></g>`;
  }
  for (let i=0; i<randInt(4)+2; i++) {
    const cx=rand(0,W), cy=rand(H*0.3,H*0.7), op=(rand(0.35,0.65)).toFixed(2);
    clouds += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rand(12,25).toFixed(1)}" ry="${rand(6,12).toFixed(1)}" fill="rgba(255,255,255,${op})"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${skyTop}"/><stop offset="100%" stop-color="${skyBot}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#sky)"/>${clouds}</svg>`;
}

// ── Scene 2: Ocean Waves ──
function sceneOceanWaves() {
  const deep=pick(["#006994","#0077be","#005a7c","#1a5276"]);
  const shallow=pick(["#40a4df","#5dade2","#76d7ea","#87ceeb"]);
  let waves="";
  for (let layer=0; layer<randInt(3)+4; layer++) {
    const yBase=H*0.3+layer*(H*0.15), amp=rand(3,8), freq=rand(0.02,0.05), op=(0.15+layer*0.08).toFixed(2);
    let path=`M 0 ${yBase}`;
    for (let x=0;x<=W;x+=5) path+=` L ${x} ${(yBase+Math.sin(x*freq+layer*1.5)*amp+rand(-2,2)).toFixed(1)}`;
    path+=` L ${W} ${H} L 0 ${H} Z`;
    waves+=`<path d="${path}" fill="rgba(255,255,255,${op})" stroke="rgba(255,255,255,${(+op+0.1).toFixed(2)})" stroke-width="${rand(1,2.5).toFixed(1)}"/>`;
  }
  for (let i=0;i<randInt(6)+3;i++) {
    const cx=rand(0,W),cy=rand(H*0.4,H),rx=rand(3,12),ry=rand(1,4),op=(rand(0.2,0.5)).toFixed(2);
    waves+=`<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="rgba(255,255,220,${op})" transform="rotate(${rand(-15,15).toFixed(1)},${cx.toFixed(1)},${cy.toFixed(1)})"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${shallow}"/><stop offset="100%" stop-color="${deep}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#sea)"/>${waves}</svg>`;
}

// ── Scene 3: Sunset Glow ──
function sceneSunsetGlow() {
  const top=pick(["#ff4500","#ff6347","#dc143c","#ff1493"]),mid=pick(["#ff8c00","#ffa500","#ff7f50","#ffd700"]),bot=pick(["#ffe4b5","#fffacd","#ffe4c4","#ffb347"]);
  const sunX=W*rand(0.3,0.7),sunY=H*rand(0.2,0.45),sunR=rand(18,28);
  let clouds="";
  for (let i=0;i<randInt(4)+2;i++) {
    const cx=rand(-20,W+20),cy=rand(H*0.1,H*0.65),op=(rand(0.25,0.55)).toFixed(2),hue=rand(0,60);
    clouds+=`<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rand(20,50).toFixed(1)}" ry="${rand(8,18).toFixed(1)}" fill="hsla(${hue.toFixed(0)},70%,70%,${op})"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="sunset" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${top}"/><stop offset="50%" stop-color="${mid}"/><stop offset="100%" stop-color="${bot}"/></linearGradient><radialGradient id="sunGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(255,255,200,1)"/><stop offset="40%" stop-color="rgba(255,200,50,0.8)"/><stop offset="100%" stop-color="rgba(255,100,0,0)"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#sunset)"/><circle cx="${sunX.toFixed(1)}" cy="${sunY.toFixed(1)}" r="${(sunR*2).toFixed(1)}" fill="url(#sunGlow)"/><circle cx="${sunX.toFixed(1)}" cy="${sunY.toFixed(1)}" r="${sunR.toFixed(1)}" fill="rgba(255,250,205,0.95)"/>${clouds}</svg>`;
}

// ── Scene 4: Forest Green ──
function sceneForestGreen() {
  const skyColor=pick(["#87ceeb","#b0e0e6","#add8e6","#e0ffff"]);
  const leafColors=["#228b22","#32cd32","#2e8b57","#3cb371","#006400","#008000"];
  let trees="";
  for (let i=0;i<randInt(8)+6;i++) {
    const tx=rand(-5,W+5),th=rand(H*0.25,H*0.5),tw=th*rand(0.25,0.45),dark=randInt(2)===0;
    trees+=`<path d="M ${tx.toFixed(1)} ${H} L ${(tx+tw/2).toFixed(1)} ${(H-th).toFixed(1)} L ${(tx+tw).toFixed(1)} ${H} Z" fill="${dark?"rgba(0,50,0,0.6)":pick(leafColors)}" opacity="${(rand(0.5,0.9)).toFixed(2)}"/>`;
  }
  for (let i=0;i<randInt(3)+1;i++) {
    const tx=rand(W*0.05,W*0.85),th=rand(H*0.4,H*0.75),tw=th*rand(0.3,0.5);
    trees+=`<path d="M ${tx.toFixed(1)} ${H} L ${(tx+tw*0.15).toFixed(1)} ${(H-th*0.6).toFixed(1)} L ${(tx+tw*0.5).toFixed(1)} ${(H-th).toFixed(1)} L ${(tx+tw*0.85).toFixed(1)} ${(H-th*0.6).toFixed(1)} L ${(tx+tw).toFixed(1)} ${H} Z" fill="${pick(leafColors)}" opacity="${(rand(0.6,0.95)).toFixed(2)}"/>`;
  }
  for (let i=0;i<randInt(10)+5;i++) {
    const lx=rand(0,W),ly=rand(H*0.2,H),lr=rand(2,6),op=(rand(0.15,0.4)).toFixed(2);
    trees+=`<circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="${lr.toFixed(1)}" fill="rgba(255,255,200,${op})"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="forestSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${skyColor}"/><stop offset="40%" stop-color="#98fb98"/><stop offset="100%" stop-color="#228b22"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#forestSky)"/>${trees}</svg>`;
}

function puzzlePath() {
  const w=PIECE_W,h=PIECE_H,r=4,tabR=10;
  return [`M ${r} 0`,`L ${w*0.5-tabR} 0`,`Q ${w*0.5} ${-tabR*0.8} ${w*0.5+tabR} 0`,`L ${w-r} 0`,`Q ${w} 0 ${w} ${r}`,`L ${w} ${h*0.45-tabR*0.3}`,`Q ${w+tabR*0.6} ${h*0.45} ${w} ${h*0.45+tabR*0.3}`,`L ${w} ${h-r}`,`Q ${w} ${h} ${w-r} ${h}`,`L ${r} ${h}`,`Q 0 ${h} 0 ${h-r}`,`L 0 ${r}`,`Q 0 0 ${r} 0`,"Z"].join(" ");
}

const SCENES=[sceneSkyClouds,sceneOceanWaves,sceneSunsetGlow,sceneForestGreen];
const names=["sky_clouds","ocean_waves","sunset","forest"];

for (let s=0;s<SCENES.length;s++) {
  const svg = SCENES[s]();
  const bgBase = await sharp(Buffer.from(svg)).png().toBuffer();
  
  const correctX=randInt(W-PIECE_W-40)+20,pieceY=randInt(H-PIECE_H-40)+20;
  
  const holeSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><mask id="holeMask"><rect width="${W}" height="${H}" fill="white"/><path d="${puzzlePath()}" transform="translate(${correctX},${pieceY})" fill="black"/></mask>
    <filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="0.5"/></filter></defs>
    <path d="${puzzlePath()}" transform="translate(${correctX},${pieceY})" fill="none" stroke="#000" stroke-width="2.5" opacity="0.4" filter="url(#shadow)"/>
    <rect width="${W}" height="${H}" fill="rgba(0,0,0,0.4)" mask="url(#holeMask)"/>
    <path d="${puzzlePath()}" transform="translate(${correctX},${pieceY})" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1"/></svg>`;
  
  const bgWithHole=await sharp(bgBase).composite([{input:Buffer.from(holeSvg),blend:"over"}]).png().toBuffer();
  writeFileSync(`scripts/test_scene_${names[s]}.png`,bgWithHole);
  console.log(`OK ${names[s]}: ${bgWithHole.length} bytes`);
}
console.log("\nDone!");
