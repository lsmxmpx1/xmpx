import { NextRequest, NextResponse } from "next/server";

// 排除易混淆字符：0/O、1/I、L、8/B 等，降低用户误读
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LEN = 5;
const W = 140;
const H = 48;

const COLORS = ["#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed", "#0891b2", "#db2777"];

function randInt(max: number) {
  return Math.floor(Math.random() * max);
}
function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}
function pick<T>(arr: T[]): T {
  return arr[randInt(arr.length)];
}

function genCode(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += CHARSET[randInt(CHARSET.length)];
  return s;
}

function renderSvg(code: string) {
  const n = code.length;
  // 字符间距收紧并加入随机偏移，制造重叠与错位，提升机器识别难度
  const step = W / (n + 0.6);
  const startX = step * 0.8;

  const chars: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = startX + i * step + rand(-3, 3);
    const y = H / 2 + randInt(10) - 5;
    const rotate = Math.round(rand(-28, 28));
    const skew = Math.round(rand(-12, 12));
    const size = Math.round(rand(28, 40));
    const color = pick(COLORS);

    // 背景“幽灵”字符：半透明、错位、异色，干扰 OCR
    const gx = x + rand(-6, 6);
    const gy = y + rand(-6, 6);
    const gColor = pick(COLORS);
    chars.push(
      `<text x="${gx.toFixed(1)}" y="${gy.toFixed(1)}" font-family="Arial, sans-serif" font-size="${Math.round(
        size * 0.95,
      )}" font-weight="bold" fill="${gColor}" opacity="0.18" text-anchor="middle" transform="rotate(${Math.round(
        rand(-30, 30),
      )} ${gx.toFixed(1)} ${gy.toFixed(1)})">${pick(CHARSET.split(""))}</text>`,
    );

    // 真实字符
    chars.push(
      `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="Arial, sans-serif" font-size="${size}" font-weight="bold" fill="${color}" text-anchor="middle" transform="rotate(${rotate} ${x.toFixed(
        1,
      )} ${y.toFixed(1)}) skewX(${skew})">${code[i]}</text>`,
    );
  }

  // 干扰线：直线 + 贝塞尔曲线，数量增多、粗细/透明度随机
  const lines: string[] = [];
  for (let i = 0; i < 9; i++) {
    const x1 = rand(0, W);
    const y1 = rand(0, H);
    const x2 = rand(0, W);
    const y2 = rand(0, H);
    const color = pick(COLORS);
    lines.push(
      `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(
        1,
      )}" stroke="${color}" stroke-width="${rand(0.6, 1.6).toFixed(2)}" opacity="${rand(0.25, 0.55).toFixed(
        2,
      )}"/>`,
    );
  }
  for (let i = 0; i < 5; i++) {
    const x1 = rand(0, W);
    const y1 = rand(0, H);
    const cx = rand(0, W);
    const cy = rand(0, H);
    const x2 = rand(0, W);
    const y2 = rand(0, H);
    const color = pick(COLORS);
    lines.push(
      `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(
        1,
      )} ${y2.toFixed(1)}" stroke="${color}" stroke-width="${rand(0.6, 1.4).toFixed(2)}" fill="none" opacity="${rand(
        0.2,
        0.5,
      ).toFixed(2)}"/>`,
    );
  }

  // 噪点 + 短划痕
  const dots: string[] = [];
  for (let i = 0; i < 150; i++) {
    const cx = rand(0, W);
    const cy = rand(0, H);
    const r = rand(0.3, 1.7).toFixed(2);
    dots.push(
      `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="${pick(COLORS)}" opacity="${rand(
        0.3,
        0.7,
      ).toFixed(2)}"/>`,
    );
  }
  for (let i = 0; i < 24; i++) {
    const x1 = rand(0, W);
    const y1 = rand(0, H);
    const len = rand(2, 6);
    const ang = rand(0, Math.PI);
    dots.push(
      `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${(x1 + Math.cos(ang) * len).toFixed(
        1,
      )}" y2="${(y1 + Math.sin(ang) * len).toFixed(1)}" stroke="${pick(COLORS)}" stroke-width="0.6" opacity="0.4"/>`,
    );
  }

  // 横向波浪干扰带（半透明）
  const wave = `<path d="M0 ${rand(8, 16).toFixed(1)} Q ${W / 2} ${rand(28, 40).toFixed(
    1,
  )} ${W} ${rand(8, 16).toFixed(1)}" stroke="${pick(COLORS)}" stroke-width="1" fill="none" opacity="0.25"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#eef2ff"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${dots.join("")}
  ${lines.join("")}
  ${wave}
  ${chars.join("")}
</svg>`;
}

export async function GET() {
  const code = genCode(CODE_LEN);
  const svg = renderSvg(code);

  const res = new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });

  // 明文存入 httpOnly cookie，仅服务端比对；有效期 5 分钟
  res.cookies.set("captcha", code, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });

  return res;
}
