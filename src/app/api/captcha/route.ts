import { NextResponse } from "next/server";
import sharp from "sharp";

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

/**
 * 生成拼图块形状的 SVG path（简化版：左侧平直手柄 + 右侧一凸一凹）
 * 尺寸 PIECE_W × PIECE_H，原点在左上角
 */
function puzzlePath(): string {
  const w = PIECE_W;
  const h = PIECE_H;
  const r = 4;           // 圆角
  const tabR = 10;       // 凸起/凹陷半径

  return [
    // 左边缘：直边（拖拽手柄）
    `M ${r} 0`,
    // 上边缘：左圆角 → 中间凸起 → 右圆角
    `L ${w * 0.5 - tabR} 0`,
    `Q ${w * 0.5} ${-tabR * 0.8} ${w * 0.5 + tabR} 0`,
    `L ${w - r} 0`,
    // 右上圆角
    `Q ${w} 0 ${w} ${r}`,
    // 右边缘：上半 → 中间凹陷 → 下半
    `L ${w} ${h * 0.45 - tabR * 0.3}`,
    `Q ${w + tabR * 0.6} ${h * 0.45} ${w} ${h * 0.45 + tabR * 0.3}`,
    `L ${w} ${h - r}`,
    // 右下圆角
    `Q ${w} ${h} ${w - r} ${h}`,
    // 下边缘：右 → 左
    `L ${r} ${h}`,
    // 左下圆角
    `Q 0 ${h} 0 ${h - r}`,
    // 左边缘（直的）
    `L 0 ${r}`,
    // 左上圆角
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

  // ── 1. 生成背景图（渐变 + 随机装饰） ──
  const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${pickBgColor()}"/>
        <stop offset="100%" stop-color="${pickBgColor()}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    ${decorationShapes()}
  </svg>`;

  const bgBase = await sharp(Buffer.from(bgSvg)).png().toBuffer();

  // ── 2. 在背景上挖出拼图缺口（半透明暗色遮罩） ──
  const holeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <mask id="holeMask">
        <rect width="${W}" height="${H}" fill="white"/>
        <path d="${puzzlePath()}" transform="translate(${correctX},${pieceY})" fill="black"/>
      </mask>
      <filter id="shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.4"/>
      </filter>
    </defs>
    <!-- 缺口阴影 -->
    <path d="${puzzlePath()}" transform="translate(${correctX},${pieceY})"
          fill="none" stroke="#000" stroke-width="2" opacity="0.35" filter="url(#shadow)"/>
    <!-- 缺口内部（稍暗） -->
    <rect width="${W}" height="${H}" fill="rgba(0,0,0,0.35)" mask="url(#holeMask)"/>
  </svg>`;

  const bgWithHole = await sharp(bgBase)
    .composite([{ input: Buffer.from(holeSvg), blend: "over" }])
    .png()
    .toBuffer();

  // ── 3. 提取拼图块（裁剪矩形 + 拼图形状描边 + 投影） ──
  const cropped = await sharp(bgBase)
    .extract({ left: Math.round(correctX), top: Math.round(pieceY), width: PIECE_W, height: PIECE_H })
    .png()
    .toBuffer();

  // 拼图块 = 裁剪区域 + 白色半透明底（确保可见）+ 拼图形状描边 + 阴影
  const pieceOverlaySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PIECE_W}" height="${PIECE_H}">
    <defs>
      <filter id="ps">
        <feDropShadow dx="1" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.3"/>
      </filter>
    </defs>
    <!-- 半透明白底让拼图块在任意背景上可见 -->
    <rect width="${PIECE_W}" height="${PIECE_H}" fill="rgba(255,255,255,0.35)" rx="3"/>
    <!-- 拼图形状描边 -->
    <path d="${puzzlePath()}" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2" filter="url(#ps)"/>
    <!-- 内部微暗增加立体感 -->
    <path d="${puzzlePath()}" fill="rgba(0,0,0,0.08)"/>
  </svg>`;

  const piece = await sharp(cropped)
    .composite([{ input: Buffer.from(pieceOverlaySvg), blend: "over" }])
    .png()
    .toBuffer();

  return { bg: bgWithHole, piece, correctX: Math.round(correctX), pieceY: Math.round(pieceY) };
}

/** 随机选取一个好看的背景渐变色 */
let _bgColors: string[] | null = null;
function pickBgColor(): string {
  if (!_bgColors) {
    _bgColors = [
      "#667eea", "#764ba2", "#f093fb", "#f5576c", "#4facfe",
      "#00f2fe", "#43e97b", "#38f9d7", "#fa709a", "#fee140",
      "#a18cd1", "#fbc2eb", "#fad0c4", "#ffecd2", "#a1c4fd",
      "#c2e9fb", "#d4fc79", "#96e6a1", "#84fab0", "#8fd3f4",
      "#fccb90", "#d57eeb", "#89f7fe", "#66a6ff", "#eb3349",
      "#f45c43", "#ff512f", "#dd2476", "#11998e", "#38ef7d",
    ];
  }
  return _bgColors[randInt(_bgColors.length)];
}

/** 在背景上加一些随机装饰（圆形、线条），增加视觉丰富度 */
function decorationShapes(): string {
  const shapes: string[] = [];
  const count = randInt(6) + 4;
  for (let i = 0; i < count; i++) {
    const cx = rand(0, W);
    const cy = rand(0, H);
    const r = rand(10, 40);
    const op = (rand(0.03, 0.12)).toFixed(3);
    shapes.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}"
                    fill="rgba(255,255,255,${op})"/>`);
  }
  // 几条线条
  for (let i = 0; i < 3; i++) {
    const x1 = rand(0, W);
    const y1 = rand(0, H);
    const len = rand(30, 80);
    const ang = rand(0, Math.PI * 2);
    const op = (rand(0.04, 0.1)).toFixed(3);
    shapes.push(
      `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}"
             x2="${(x1 + Math.cos(ang) * len).toFixed(1)}" y2="${(y1 + Math.sin(ang) * len).toFixed(1)}"
             stroke="rgba(255,255,255,${op})" stroke-width="${rand(1, 3).toFixed(1)}"/>`
    );
  }
  return shapes.join("\n");
}

// ─── GET 接口：生成拼图滑块验证码 ──────────────────────────────
export async function GET(req: Request) {
  try {
    const { bg, piece, correctX, pieceY } = await generatePuzzle();

    const res = NextResponse.json({
      bg: `data:image/png;base64,${bg.toString("base64")}`,
      piece: `data:image/png;base64,${piece.toString("base64")}`,
      pieceY,
      w: W,
    });

    // 正确 X 坐标存入 httpOnly Cookie，前端不可读
    res.cookies.set("puzzle_x", String(correctX), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 300, // 5 分钟过期
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
