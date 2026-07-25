import { NextResponse } from "next/server";
import sharp from "sharp";

// 每次请求动态生成，不缓存
export const dynamic = "force-dynamic";

// ─── 拼图滑块验证码配置 ──────────────────────────────────────
const W = 280;        // 背景图宽度
const H = 160;        // 背景图高度
const PIECE_W = 44;   // 拼图块宽度
const PIECE_H = 44;   // 拼图块高度
const TOLERANCE = 3;  // 校验容差（px）
const PADDING = 20;   // 拼图块距左右边界的最小距离

function randInt(max: number) {
  return Math.floor(Math.random() * max);
}
function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// ─── 自然风景场景生成器 ──────────────────────────────────────
// 每种场景用程序化 SVG 绘制逼真的自然风景，无需外部图片

type SceneGenerator = () => string;

/** 所有可用的自然风景场景 */
const SCENES: SceneGenerator[] = [
  sceneSkyClouds,       // 蓝天白云
  sceneOceanWaves,       // 海洋波浪
  sceneSunsetGlow,       // 日落晚霞
  sceneForestGreen,      // 绿色森林
  sceneDesertDunes,      // 沙漠沙丘
  sceneMountainRange,    // 远山剪影
  sceneLakeReflection,   // 湖面倒影
  sceneCherryBlossom,    // 樱花飘落
  sceneAuroraNight,      // 极光夜空
  sceneAutumnMaple,      // 秋天枫叶
  sceneSnowMountain,     // 雪山
  sceneTropicalBeach,    // 热带海滩
];

/**
 * 随机选择一个场景并生成完整的背景 SVG
 */
function generateNatureBackground(): string {
  const scene = SCENES[randInt(SCENES.length)];
  return scene();
}

// ═══════════════════════════════════════════════════════════════
// 场景 1：蓝天白云 — 渐变蓝天 + 多层云朵
// ═══════════════════════════════════════════════════════════════
function sceneSkyClouds(): string {
  const skyTop = pick(["#1e90ff", "#4169e1", "#00bfff", "#87ceeb"]);
  const skyBot = pick(["#b0e0e6", "#e0f6ff", "#add8e6", "#f0f8ff"]);

  let clouds = "";
  // 大朵蓬松云（多个椭圆叠加）
  for (let i = 0; i < randInt(3) + 2; i++) {
    const cx = rand(-30, W + 10);
    const cy = rand(5, H * 0.5);
    const scale = rand(0.6, 1.4);
    const op = (rand(0.7, 0.95)).toFixed(2);
    clouds += `
      <g transform="translate(${cx.toFixed(1)},${cy.toFixed(1)}) scale(${scale.toFixed(2)})" opacity="${op}">
        <ellipse cx="0" cy="0" rx="28" ry="14" fill="#fff"/>
        <ellipse cx="-18" cy="3" rx="20" ry="11" fill="#fff"/>
        <ellipse cx="18" cy="2" rx="22" ry="12" fill="#fff"/>
        <ellipse cx="-8" cy="-6" rx="16" ry="9" fill="#fff"/>
        <ellipse cx="12" cy="-5" rx="18" ry="10" fill="#fff"/>
        <ellipse cx="0" cy="5" rx="24" ry="8" fill="#fff"/>
      </g>`;
  }
  // 小云点缀
  for (let i = 0; i < randInt(4) + 2; i++) {
    const cx = rand(0, W);
    const cy = rand(H * 0.3, H * 0.7);
    const op = (rand(0.35, 0.65)).toFixed(2);
    clouds += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rand(12,25).toFixed(1)}" ry="${rand(6,12).toFixed(1)}" fill="rgba(255,255,255,${op})"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${skyTop}"/>
        <stop offset="100%" stop-color="${skyBot}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#sky)"/>
    ${clouds}
  </svg>`;
}

// ═══════════════════════════════════════════════════════════════
// 场景 2：海洋波浪 — 深蓝到浅蓝渐变 + 波纹线 + 光斑
// ═══════════════════════════════════════════════════════════════
function sceneOceanWaves(): string {
  const deep = pick(["#006994", "#0077be", "#005a7c", "#1a5276"]);
  const shallow = pick(["#40a4df", "#5dade2", "#76d7ea", "#87ceeb"]);

  let waves = "";
  // 多层波纹
  for (let layer = 0; layer < randInt(3) + 4; layer++) {
    const yBase = H * 0.3 + layer * (H * 0.15);
    const amp = rand(3, 8);
    const freq = rand(0.02, 0.05);
    const op = (0.15 + layer * 0.08).toFixed(2);
    const sw = rand(1, 2.5).toFixed(1);
    let path = `M 0 ${yBase}`;
    for (let x = 0; x <= W; x += 5) {
      const y = yBase + Math.sin(x * freq + layer * 1.5) * amp + rand(-2, 2);
      path += ` L ${x} ${y.toFixed(1)}`;
    }
    path += ` L ${W} ${H} L 0 ${H} Z`;
    waves += `<path d="${path}" fill="rgba(255,255,255,${op})" stroke="rgba(255,255,255,${(+op + 0.1).toFixed(2)})" stroke-width="${sw}"/>`;
  }
  // 光斑（阳光在海面的反射）
  for (let i = 0; i < randInt(6) + 3; i++) {
    const cx = rand(0, W);
    const cy = rand(H * 0.4, H);
    const rx = rand(3, 12);
    const ry = rand(1, 4);
    const op = (rand(0.2, 0.5)).toFixed(2);
    waves += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="rgba(255,255,220,${op})" transform="rotate(${rand(-15,15).toFixed(1)},${cx.toFixed(1)},${cy.toFixed(1)})"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${shallow}"/>
        <stop offset="100%" stop-color="${deep}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#sea)"/>
    ${waves}
  </svg>`;
}

// ═���═════════════════════════════════════════════════════════════
// 场景 3：日落晚霞 — 橙红渐变 + 太阳 + 云彩染色
// ═══════════════════════════════════════════════════════════════
function sceneSunsetGlow(): string {
  const top = pick(["#ff4500", "#ff6347", "#dc143c", "#ff1493"]);
  const mid = pick(["#ff8c00", "#ffa500", "#ff7f50", "#ffd700"]);
  const bot = pick(["#ffe4b5", "#fffacd", "#ffe4c4", "#ffb347"]);

  const sunX = W * (rand(0.3, 0.7));
  const sunY = H * rand(0.2, 0.45);
  const sunR = rand(18, 28);

  let clouds = "";
  for (let i = 0; i < randInt(4) + 2; i++) {
    const cx = rand(-20, W + 20);
    const cy = rand(H * 0.1, H * 0.65);
    const op = (rand(0.25, 0.55)).toFixed(2);
    const hue = rand(0, 60); // 暖色调
    clouds += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rand(20,50).toFixed(1)}" ry="${rand(8,18).toFixed(1)}" fill="hsla(${hue.toFixed(0)},70%,70%,${op})"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="sunset" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${top}"/>
        <stop offset="50%" stop-color="${mid}"/>
        <stop offset="100%" stop-color="${bot}"/>
      </linearGradient>
      <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(255,255,200,1)" stop-opacity="1"/>
        <stop offset="40%" stop-color="rgba(255,200,50,0.8)" stop-opacity="0.8"/>
        <stop offset="100%" stop-color("rgba(255,100,0,0)") stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#sunset)"/>
    <!-- 太阳光晕 -->
    <circle cx="${sunX.toFixed(1)}" cy="${sunY.toFixed(1)}" r="${(sunR * 2).toFixed(1)}" fill="url(#sunGlow)"/>
    <!-- 太阳本体 -->
    <circle cx="${sunX.toFixed(1)}" cy="${sunY.toFixed(1)}" r="${sunR.toFixed(1)}" fill="rgba(255,250,205,0.95)"/>
    ${clouds}
  </svg>`;
}

// ═══════════════════════════════════════════════════════════════
// 场景 4：绿色森林 — 多层绿色渐变 + 树木剪影 + 光斑
// ═══════════════════════════════════════════════════════════════
function sceneForestGreen(): string {
  const skyColor = pick(["#87ceeb", "#b0e0e6", "#add8e6", "#e0ffff"]);
  const leafColors = ["#228b22", "#32cd32", "#2e8b57", "#3cb371", "#006400", "#008000"];

  let trees = "";
  // 远处树木层（深色小）
  for (let i = 0; i < randInt(8) + 6; i++) {
    const tx = rand(-5, W + 5);
    const th = rand(H * 0.25, H * 0.5);
    const tw = th * rand(0.25, 0.45);
    const dark = randInt(2) === 0;
    trees += `<path d="M ${tx.toFixed(1)} ${H} L ${(tx + tw / 2).toFixed(1)} ${(H - th).toFixed(1)} L ${(tx + tw).toFixed(1)} ${H} Z"
      fill="${dark ? "rgba(0,50,0,0.6)" : pick(leafColors)}" opacity="${(rand(0.5, 0.9)).toFixed(2)}"/>`;
  }
  // 近处大树
  for (let i = 0; i < randInt(3) + 1; i++) {
    const tx = rand(W * 0.05, W * 0.85);
    const th = rand(H * 0.4, H * 0.75);
    const tw = th * rand(0.3, 0.5);
    trees += `<path d="M ${tx.toFixed(1)} ${H} L ${(tx + tw * 0.15).toFixed(1)} ${(H - th * 0.6).toFixed(1)}
                       L ${(tx + tw * 0.5).toFixed(1)} ${(H - th).toFixed(1)}
                       L ${(tx + tw * 0.85).toFixed(1)} ${(H - th * 0.6).toFixed(1)}
                       L ${(tx + tw).toFixed(1)} ${H} Z"
      fill="${pick(leafColors)}" opacity="${(rand(0.6, 0.95)).toFixed(2)}"/>`;
  }
  // 阳光透过树叶的光斑
  for (let i = 0; i < randInt(10) + 5; i++) {
    const lx = rand(0, W);
    const ly = rand(H * 0.2, H);
    const lr = rand(2, 6);
    const op = (rand(0.15, 0.4)).toFixed(2);
    trees += `<circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="${lr.toFixed(1)}" fill="rgba(255,255,200,${op})"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="forestSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${skyColor}"/>
        <stop offset="40%" stop-color="#98fb98"/>
        <stop offset="100%" stop-color="#228b22"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#forestSky)"/>
    ${trees}
  </svg>`;
}

// ═══════════════════════════════════════════════════════════════
// 场景 5：沙漠沙丘 — 金黄渐变 + 沙丘曲线 + 热浪扭曲感
// ═══════════════════════════════════════════════════════════════
function sceneDesertDunes(): string {
  const sandTop = pick(["#f4a460", "#daa520", "#cd853f", "#d2691e"]);
  const sandBot = pick(["#faebd7", "#fff8dc", "#ffe4b5", "#ffe4c4"]);
  const skyCol = pick(["#87ceeb", "#b0c4de", "#add8e6", "#f0e68c"]);

  let dunes = "";
  // 多层沙丘
  for (let layer = 0; layer < randInt(3) + 3; layer++) {
    const yBase = H * (0.35 + layer * 0.18);
    const amp = rand(10, 25);
    const op = (0.4 + layer * 0.18).toFixed(2);
    let d = `M 0 ${H}`;
    for (let x = 0; x <= W; x += 4) {
      const y = yBase + Math.sin(x * 0.02 + layer * 2) * amp + Math.sin(x * 0.008 + layer) * amp * 0.6;
      d += ` L ${x} ${Math.min(y, H).toFixed(1)}`;
    }
    d += ` L ${W} ${H} Z`;
    const fillColor = layer % 2 === 0 ? sandTop : sandBot;
    dunes += `<path d="${d}" fill="${fillColor}" opacity="${op}"/>`;
  }
  // 沙粒纹理点
  for (let i = 0; i < randInt(30) + 15; i++) {
    const dx = rand(0, W);
    const dy = rand(H * 0.4, H);
    const dr = rand(0.5, 1.5);
    const dop = (rand(0.15, 0.4)).toFixed(2);
    dunes += `<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="${dr.toFixed(1)}" fill="rgba(255,248,220,${dop})"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="desertSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${skyCol}"/>
        <stop offset="100%" stop-color="#ffe4b5"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#desertSky)"/>
    ${dunes}
  </svg>`;
}

// ═══════════════════════════════════════════════════════════════
// 场景 6：远山剪影 — 天空渐变 + 层叠山脉轮廓
// ═══════════════════════════════════════════════════════════════
function sceneMountainRange(): string {
  const skyTop = pick(["#4a6fa5", "#5f7c9a", "#6b8cae", "#778ca3"]);
  const skyBot = pick(["#b8d4e8", "#c9dde8", "#d4e4ed", "#e8f0f5"]);

  let mountains = "";
  // 最远的山（最浅）
  const layers = [
    { baseY: 0.45, amp: 15, freq: 0.01, color: "rgba(120,140,160,0.35)", detail: 0.008 },
    { baseY: 0.52, amp: 22, freq: 0.015, color: "rgba(80,100,120,0.5)", detail: 0.012 },
    { baseY: 0.58, amp: 30, freq: 0.02, color: "rgba(50,70,90,0.65)", detail: 0.015 },
    { baseY: 0.65, amp: 38, freq: 0.025, color: "rgba(30,50,70,0.8)", detail: 0.018 },
  ];

  for (const l of layers) {
    let p = `M 0 ${H}`;
    for (let x = 0; x <= W; x += 3) {
      const y = H * l.baseY
        + Math.sin(x * l.freq + rand(-0.5, 0.5)) * l.amp
        + Math.sin(x * l.detail + rand(-0.3, 0.3)) * l.amp * 0.4;
      p += ` L ${x} ${y.toFixed(1)}`;
    }
    p += ` L ${W} ${H} Z`;
    mountains += `<path d="${p}" fill="${l.color}"/>`;
  }
  // 雪顶（最高的山峰上一点白）
  for (let i = 0; i < randInt(2); i++) {
    const sx = rand(W * 0.2, W * 0.8);
    mountains += `<path d="M ${(sx - 8).toFixed(1)} ${(H * 0.52).toFixed(1)} L ${sx.toFixed(1)} ${(H * 0.42).toFixed(1)} L ${(sx + 8).toFixed(1)} ${(H * 0.52).toFixed(1)} Z" fill="rgba(255,255,255,0.7)"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="mtSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${skyTop}"/>
        <stop offset="100%" stop-color="${skyBot}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#mtSky)"/>
    ${mountains}
  </svg>`;
}

// ═══════════════════════════════════════════════════════════════
// 场景 7：湖面倒影 — 天水一色 + 倒影模糊效果
// ═══════════════════════════════════════════════════════════════
function sceneLakeReflection(): string {
  const waterTop = pick(["#4a90a4", "#5f9ea0", "#4682b4", "#5cacee"]);
  const waterBot = pick(["#1a3a4a", "#2f4f4f", "#191970", "#27408b"]);

  let ripples = "";
  // 水面涟漪
  for (let i = 0; i < randInt(5) + 3; i++) {
    const rcx = rand(W * 0.1, W * 0.9);
    const rcy = rand(H * 0.4, H * 0.9);
    const rr = rand(8, 25);
    const rop = (rand(0.08, 0.2)).toFixed(2);
    ripples += "<ellipse cx=\"" + rcx.toFixed(1) + "\" cy=\"" + rcy.toFixed(1) + "\" rx=\"" + rr.toFixed(1) + "\" ry=\"" + (rr * 0.3).toFixed(1) + "\" fill=\"none\" stroke=\"rgba(180,220,255," + rop + ")\" stroke-width=\"1\"/>";
    if (rr > 15) {
      ripples += "<ellipse cx=\"" + rcx.toFixed(1) + "\" cy=\"" + rcy.toFixed(1) + "\" rx=\"" + (rr * 0.6).toFixed(1) + "\" ry=\"" + (rr * 0.18).toFixed(1) + "\" fill=\"none\" stroke=\"rgba(180,220,255," + (+Number(rop) + 0.05).toFixed(2) + ")\" stroke-width=\"0.8\"/>";
    }
  }
  // 远山倒影
  for (let i = 0; i < randInt(2) + 1; i++) {
    const my = H * (0.25 + i * 0.08);
    let mp = `M 0 ${my.toFixed(1)}`;
    for (let x = 0; x <= W; x += 4) {
      mp += ` L ${x} ${(my + Math.sin(x * 0.015 + i) * rand(5, 12)).toFixed(1)}`;
    }
    mp += ` L ${W} ${H} L 0 ${H} Z`;
    ripples += `<path d="${mp}" fill="rgba(60,80,100,${(0.08 + i * 0.06).toFixed(2)})"/>`;
  }
  // 月亮或太阳倒影光带
  const reflectX = rand(W * 0.2, W * 0.8);
  for (let i = 0; i < randInt(8) + 4; i++) {
    const ry = H * 0.5 + i * (H * 0.06);
    const rw = rand(2, 6 + (1 - i / 10) * 15);
    const rop = (rand(0.1, 0.3) * (1 - i / 12)).toFixed(2);
    ripples += `<rect x="${(reflectX - rw / 2).toFixed(1)}" y="${ry.toFixed(1)}" width="${rw.toFixed(1)}" height="${rand(1, 3).toFixed(1)}" fill="rgba(200,230,255,${rop})" rx="1"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="lake" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${waterTop}"/>
        <stop offset="100%" stop-color="${waterBot}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#lake)"/>
    ${ripples}
  </svg>`;
}

// ═══════════════════════════════════════════════════════════════
// 场景 8：樱花飘落 — 粉色天空 + 飘落花瓣
// ═══════════════════════════════════════════════════════════════
function sceneCherryBlossom(): string {
  const skyTop = pick(["#fce4ec", "#f8bbd0", "#f48fb1", "#fff0f5"]);
  const skyBot = pick(["#ffffff", "#fff5f8", "#fefefe", "#fdf0f5"]);

  let petals = "";
  // 飘落的樱花花瓣
  for (let i = 0; i < randInt(15) + 8; i++) {
    const px = rand(0, W);
    const py = rand(0, H);
    const ps = rand(4, 10);
    const prot = rand(0, 360);
    const pop = (rand(0.5, 0.95)).toFixed(2);
    const pink = pick(["#ffb7c5", "#ffc0cb", "#ff69b4", "#ffaec9", "#fdbcb4"]);
    petals += `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}"
      rx="${ps.toFixed(1)}" ry="${(ps * 0.6).toFixed(1)}" fill="${pink}"
      opacity="${pop}" transform="rotate(${prot.toFixed(1)},${px.toFixed(1)},${py.toFixed(1)})"/>`;
  }
  // 樱花树枝（角落装饰）
  const branchSide = randInt(2); // 0=左上, 1=右上
  const bx = branchSide === 0 ? -5 : W + 5;
  const bflip = branchSide === 0 ? 1 : -1;
  petals += `<path d="M ${bx} 0 Q ${(bx + bflip * 40).toFixed(1)} 30 ${(bx + bflip * 80).toFixed(1)} 15
                   Q ${(bx + bflip * 100).toFixed(1)} 25 ${(bx + bflip * 130).toFixed(1)} 10"
    fill="none" stroke="#5d4037" stroke-width="${rand(2, 3.5).toFixed(1)}" stroke-linecap="round"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="sakura" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${skyTop}"/>
        <stop offset="100%" stop-color="${skyBot}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#sakura)"/>
    ${petals}
  </svg>`;
}

// ═══════════════════════════════════════════════════════════════
// 场景 9：极光夜空 — 深夜底色 + 极光光带 + 星星
// ═══════════════════════════════════════════════════════════════
function sceneAuroraNight(): string {
  const nightTop = pick(["#0a0a20", "#0d1b2a", "#001220", "#0b1021"]);
  const nightBot = pick(["#1b2838", "#162447", "#1a1a2e", "#0f3460"]);

  let aurora = "";
  // 极光带（多层半透明曲线）
  for (let i = 0; i < randInt(3) + 2; i++) {
    const ayBase = H * (0.1 + i * 0.15);
    const auroraColors = ["#00ff88", "#00ffcc", "#88ff00", "#00ffaa", "#44ffaa", "#00ddaa"];
    const ac = pick(auroraColors);
    let ap = `M 0 ${ayBase}`;
    for (let x = 0; x <= W; x += 5) {
      const y = ayBase + Math.sin(x * 0.02 + i * 2) * rand(12, 25) + Math.cos(x * 0.008) * rand(8, 15);
      ap += ` L ${x} ${y.toFixed(1)}`;
    }
    for (let x = W; x >= 0; x -= 5) {
      const y = ayBase + Math.sin(x * 0.02 + i * 2) * rand(12, 25) + Math.cos(x * 0.008) * rand(8, 15) + rand(8, 20);
      ap += ` L ${x} ${y.toFixed(1)}`;
    }
    ap += " Z";
    aurora += `<path d="${ap}" fill="${ac}" opacity="${(rand(0.12, 0.3)).toFixed(2)}" filter="blur(3px)"/>`;
    aurora += `<path d="${ap}" fill="${ac}" opacity="${(rand(0.05, 0.15)).toFixed(2)}"/>`;
  }
  // 星星
  for (let i = 0; i < randInt(25) + 15; i++) {
    const sx = rand(0, W);
    const sy = rand(0, H * 0.7);
    const sr = rand(0.5, 2);
    const sop = (rand(0.4, 1)).toFixed(2);
    aurora += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${sr.toFixed(1)}" fill="rgba(255,255,255,${sop})"/>`;
    // 十字星光（大星星）
    if (sr > 1.4) {
      aurora += `<line x1="${(sx - sr * 2).toFixed(1)}" y1="${sy.toFixed(1)}" x2="${(sx + sr * 2).toFixed(1)}" y2="${sy.toFixed(1)}" stroke="rgba(255,255,255,${sop})" stroke-width="0.5"/>`;
      aurora += `<line x1="${sx.toFixed(1)}" y1="${(sy - sr * 2).toFixed(1)}" x2="${sx.toFixed(1)}" y2="${(sy + sr * 2).toFixed(1)}" stroke="rgba(255,255,255,${sop})" stroke-width="0.5"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${nightTop}"/>
        <stop offset="100%" stop-color="${nightBot}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#night)"/>
    ${aurora}
  </svg>`;
}

// ═══════════════════════════════════════════════════════════════
// 场景 10：秋天枫叶 — 暖橙渐变 + 飘落枫叶
// ═══════════════════════════════════════════════════════════════
function sceneAutumnMaple(): string {
  const skyTop = pick(["#deb887", "#f4a460", "#e9967a", "#fa8072"]);
  const skyBot = pick(["#ffe4b5", "#ffdab9", "#ffe4c4", "#fff8dc"]);

  let leaves = "";
  // 枫叶（用多边形模拟）
  for (let i = 0; i < randInt(12) + 6; i++) {
    const lx = rand(0, W);
    const ly = rand(0, H);
    const ls = rand(5, 12);
    const lrot = rand(0, 360);
    const lop = (rand(0.6, 1)).toFixed(2);
    const mapleColor = pick(["#ff4500", "#ff6347", "#dc143c", "#ff8c00", "#ffa500", "#b22222", "#cd5c5c"]);
    // 简化的枫叶形状（五角形变体）
    leaves += `<polygon points="
      ${lx.toFixed(1)},${(ly - ls).toFixed(1)}
      ${(lx + ls * 0.4).toFixed(1)},${(ly - ls * 0.4).toFixed(1)}
      ${(lx + ls * 0.8).toFixed(1)},${(ly - ls * 0.7).toFixed(1)}
      ${(lx + ls * 0.5).toFixed(1)},${(ly).toFixed(1)}
      ${(lx + ls * 0.9).toFixed(1)},${(ly + ls * 0.2).toFixed(1)}
      ${(lx + ls * 0.2).toFixed(1)},${(ly + ls * 0.3).toFixed(1)}
      ${(lx - ls * 0.3).toFixed(1)},${(ly + ls * 0.1).toFixed(1)}
      ${(lx - ls * 0.6).toFixed(1)},${(ly - ls * 0.3).toFixed(1)}
      ${(lx - ls * 0.2).toFixed(1)},${(ly - ls * 0.6).toFixed(1)}
    " fill="${mapleColor}" opacity="${lop}" transform="rotate(${lrot.toFixed(1)},${lx.toFixed(1)},${ly.toFixed(1)})"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="autumn" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${skyTop}"/>
        <stop offset="100%" stop-color="${skyBot}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#autumn)"/>
    ${leaves}
  </svg>`;
}

// ═══════════════════════════════════════════════════════════════
// 场景 11：雪山 — 浅灰蓝天空 + 白雪覆盖的山峰
// ═══════════════════════════════════════════════════════════════
function sceneSnowMountain(): string {
  const skyTop = pick(["#a8c0d8", "#b8cce0", "#c0d6e8", "#b0c4de"]);
  const skyBot = pick(["#e8f0f8", "#f0f5fa", "#eef3f8", "#f5f8fc"]);

  let snowMt = "";
  // 雪山主体
  const peaks = [
    { x: W * 0.15, h: H * 0.55 },
    { x: W * 0.45, h: H * 0.72 },
    { x: W * 0.75, h: H * 0.58 },
    { x: W * 0.92, h: H * 0.42 },
  ];
  // 远处的浅色山
  let farPath = `M 0 ${H}`;
  for (let x = 0; x <= W; x += 3) {
    farPath += ` L ${x} ${(H * 0.62 + Math.sin(x * 0.012) * 15).toFixed(1)}`;
  }
  farPath += ` L ${W} ${H} Z`;
  snowMt += `<path d="${farPath}" fill="rgba(200,215,230,0.5)"/>`;

  // 主山峰
  for (const pk of peaks) {
    const slopeL = rand(0.3, 0.5);
    const slopeR = rand(0.3, 0.5);
    snowMt += `<path d="
      M ${(pk.x - pk.h * slopeL).toFixed(1)} ${H}
      L ${pk.x.toFixed(1)} ${(H - pk.h).toFixed(1)}
      L ${(pk.x + pk.h * slopeR).toFixed(1)} ${H} Z
    " fill="rgba(230,238,245,0.85)"/>`;
    // 雪顶高光
    snowMt += `<path d="
      M ${(pk.x - pk.h * 0.15).toFixed(1)} ${(H - pk.h * 0.85).toFixed(1)}
      L ${pk.x.toFixed(1)} ${(H - pk.h).toFixed(1)}
      L ${(pk.x + pk.h * 0.12).toFixed(1)} ${(H - pk.h * 0.82).toFixed(1)}
      Z
    " fill="rgba(255,255,255,0.9)"/>`;
  }
  // 飘落的雪花
  for (let i = 0; i < randInt(20) + 10; i++) {
    const sx = rand(0, W);
    const sy = rand(0, H);
    const ss = rand(1, 3.5);
    const sop = (rand(0.4, 0.9)).toFixed(2);
    snowMt += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${ss.toFixed(1)}" fill="rgba(255,255,255,${sop})"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="snowSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${skyTop}"/>
        <stop offset="100%" stop-color="${skyBot}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#snowSky)"/>
    ${snowMt}
  </svg>`;
}

// ═══════════════════════════════════════════════════════════════
// 场景 12：热带海滩 — 蔚蓝海水 + 金沙滩 + 椰树剪影
// ═══════════════════════════════════════════════════════════════
function sceneTropicalBeach(): string {
  const seaTop = pick(["#006994", "#0077be", "#1e90ff", "#00bfff"]);
  const seaBot = pick(["#40a4df", "#87ceeb", "#76d7ea", "#48d1cc"]);
  const sandColor = pick(["#f4a460", "#deb887", "#d2b48c", "#eebb77"]);

  let beach = "";
  // 海水（上半部分）
  beach += `<rect x="0" y="0" width="${W}" height="${H * 0.6}" fill="${seaTop}"/>`;
  // 海浪线
  for (let wv = 0; wv < 3; wv++) {
    const wy = H * 0.55 + wv * 8;
    let wp = `M 0 ${wy}`;
    for (let x = 0; x <= W; x += 4) {
      wp += ` L ${x} ${(wy + Math.sin(x * 0.04 + wv * 2) * 4).toFixed(1)}`;
    }
    beach += `<path d="${wp}" fill="none" stroke="rgba(255,255,255,${(0.2 + wv * 0.15).toFixed(2)})" stroke-width="${(2 - wv * 0.5).toFixed(1)}"/>`;
  }
  // 沙滩（下半部分）
  beach += `<rect x="0" y="${H * 0.6}" width="${W}" height="${H * 0.4}" fill="${sandColor}"/>`;
  // 椰子树剪影（右侧）
  const palmX = W * 0.82;
  const palmH = H * 0.75;
  beach += `
    <!-- 树干 -->
    <path d="M ${palmX.toFixed(1)} ${H} Q ${(palmX + 5).toFixed(1)} ${(H * 0.6).toFixed(1)} ${(palmX + 2).toFixed(1)} ${(H * 0.35).toFixed(1)}"
      fill="none" stroke="#3d2914" stroke-width="${rand(3, 5).toFixed(1)}" stroke-linecap="round"/>
    <!-- 椰叶 -->
    <path d="M ${(palmX + 2).toFixed(1)} ${(H * 0.35).toFixed(1)}
             Q ${(palmX - 15).toFixed(1)} ${(H * 0.25).toFixed(1)} ${(palmX - 30).toFixed(1)} ${(H * 0.32).toFixed(1)}"
      fill="none" stroke="#2d5016" stroke-width="2" stroke-linecap="round"/>
    <path d="M ${(palmX + 2).toFixed(1)} ${(H * 0.36).toFixed(1)}
             Q ${(palmX + 18).toFixed(1)} ${(H * 0.28).toFixed(1)} ${(palmX + 32).toFixed(1)} ${(H * 0.35).toFixed(1)}"
      fill="none" stroke="#2d5016" stroke-width="2" stroke-linecap="round"/>
    <path d="M ${(palmX + 2).toFixed(1)} ${(H * 0.35).toFixed(1)}
             Q ${(palmX - 8).toFixed(1)} ${(H * 0.18).toFixed(1)} ${(palmX + 5).toFixed(1)} ${(H * 0.12).toFixed(1)}"
      fill="none" stroke="#2d5016" stroke-width="2" stroke-linecap="round"/>
    <path d="M ${(palmX + 2).toFixed(1)} ${(H * 0.34).toFixed(1)}
             Q ${(palmX + 10).toFixed(1)} ${(H * 0.2).toFixed(1)} ${(palmX - 5).toFixed(1)} ${(H * 0.13).toFixed(1)}"
      fill="none" stroke="#2d5016" stroke-width="2" stroke-linecap="round"/>
  `;
  // 太阳
  beach += `<circle cx="${(W * 0.2).toFixed(1)}" cy="${(H * 0.2).toFixed(1)}" r="${rand(16, 22).toFixed(1)}" fill="rgba(255,220,50,0.9)"/>`;
  beach += `<circle cx="${(W * 0.2).toFixed(1)}" cy="${(H * 0.2).toFixed(1)}" r="${rand(26, 34).toFixed(1)}" fill="rgba(255,220,50,0.15)"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${seaTop}"/>
        <stop offset="100%" stop-color="${seaBot}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#ocean)"/>
    <rect x="0" y="${H * 0.58}" width="${W}" height="${H * 0.42}" fill="${sandColor}"/>
    ${beach}
  </svg>`;
}

// ─── 工具函数 ────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[randInt(arr.length)];
}

/**
 * 生成拼图块形状的 SVG path（左侧平直手柄 + 右侧一凸一凹）
 */
function puzzlePath(): string {
  const w = PIECE_W;
  const h = PIECE_H;
  const r = 4;
  const tabR = 10;

  return [
    `M ${r} 0`,
    `L ${w * 0.5 - tabR} 0`,
    `Q ${w * 0.5} ${-tabR * 0.8} ${w * 0.5 + tabR} 0`,
    `L ${w - r} 0`,
    `Q ${w} 0 ${w} ${r}`,
    `L ${w} ${h * 0.45 - tabR * 0.3}`,
    `Q ${w + tabR * 0.6} ${h * 0.45} ${w} ${h * 0.45 + tabR * 0.3}`,
    `L ${w} ${h - r}`,
    `Q ${w} ${h} ${w - r} ${h}`,
    `L ${r} ${h}`,
    `Q 0 ${h} 0 ${h - r}`,
    `L 0 ${r}`,
    `Q 0 0 ${r} 0`,
    "Z",
  ].join(" ");
}

/** 生成带缺口的背景图（PNG buffer）+ 拼图块图片（PNG buffer）+ 正确X坐标 */
async function generatePuzzle(): Promise<{
  bg: Buffer;
  piece: Buffer;
  correctX: number;
  pieceY: number;
}> {
  const correctX = randInt(W - PIECE_W - PADDING * 2) + PADDING;
  const pieceY = randInt(H - PIECE_H - PADDING * 2) + PADDING;

  // ── 1. 用程序生成自然风景背景图（SVG → PNG） ──
  const bgSvg = generateNatureBackground();
  const bgBase = await sharp(Buffer.from(bgSvg))
    .png()
    .toBuffer();

  const pPath = puzzlePath();

  // ── 2. 在背景上画拼图缺口 ──
  // 方案：直接用 <path> 填充拼图形状（半透明深色），不依赖 clipPath/mask/filter
  // sharp 对基础 path fill+stroke 渲染最可靠
  const holeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <!-- 缺口主体：拼图形状填充深色，一眼看出"这里缺了一块" -->
    <path d="${pPath}" transform="translate(${correctX.toFixed(1)},${pieceY.toFixed(1)})"
          fill="rgba(0,0,0,0.5)"
          stroke="rgba(0,0,0,0.65)"
          stroke-width="2.5"
          stroke-linejoin="round"/>
    <!-- 内边缘高光线：增加凹陷立体感 -->
    <path d="${pPath}" transform="translate(${correctX.toFixed(1)},${pieceY.toFixed(1)})"
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          stroke-width="1.2"
          stroke-linejoin="round"/>
  </svg>`;

  const bgWithHole = await sharp(bgBase)
    .composite([{ input: Buffer.from(holeSvg), blend: "over" }])
    .png()
    .toBuffer();

  // ── 3. 提取拼图块（裁剪区域 → SVG clipPath 裁切形状 → PNG） ──
  const cropped = await sharp(bgBase)
    .extract({ left: Math.round(correctX), top: Math.round(pieceY), width: PIECE_W, height: PIECE_H })
    .png()
    .toBuffer();

  // 用 SVG <image> + clipPath 裁出拼图形状（比 sharp blend:"in" 更可靠）
  const croppedB64 = cropped.toString("base64");
  const pieceSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PIECE_W}" height="${PIECE_H}">
    <defs>
      <clipPath id="pc"><path d="${pPath}"/></clipPath>
      <filter id="ps">
        <feDropShadow dx="1" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.35"/>
      </filter>
    </defs>
    <!-- 裁剪后的背景图，按拼图形状裁切 -->
    <image width="${PIECE_W}" height="${PIECE_H}" href="data:image/png;base64,${croppedB64}" clip-path="url(#pc)"/>
    <!-- 白色描边 + 投影 -->
    <path d="${pPath}" fill="none" stroke="rgba(255,255,255,0.95)"
          stroke-width="2.5" filter="url(#ps)" stroke-linejoin="round"/>
  </svg>`;

  const piece = await sharp(Buffer.from(pieceSvg))
    .png()
    .toBuffer();

  return { bg: bgWithHole, piece, correctX: Math.round(correctX), pieceY: Math.round(pieceY) };
}

// ─── GET 接口：生成拼图滑块验证码 ──────────────────────────────
export async function GET() {
  try {
    const { bg, piece, correctX, pieceY } = await generatePuzzle();

    const res = NextResponse.json({
      bg: `data:image/png;base64,${bg.toString("base64")}`,
      piece: `data:image/png;base64,${piece.toString("base64")}`,
      pieceY,
      w: W,
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });

    res.cookies.set("puzzle_x", String(correctX), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 300,
    });

    return res;
  } catch (e) {
    console.error("[captcha] 生成拼图验证码失败:", e);
    return NextResponse.json(
      { error: "验证码生成失败，请重试" },
      { status: 500 }
    );
  }
}
