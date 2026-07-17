import { NextRequest, NextResponse } from "next/server";

// 排除易混淆字符：0/O、1/I、L、8/B 等，降低用户误读
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LEN = 5;
const W = 130;
const H = 46;

const COLORS = ["#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed", "#0891b2"];

function randInt(max: number) {
  return Math.floor(Math.random() * max);
}

function genCode(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += CHARSET[randInt(CHARSET.length)];
  return s;
}

function renderSvg(code: string) {
  const chars: string[] = [];
  const step = W / (code.length + 1);
  for (let i = 0; i < code.length; i++) {
    const x = step * (i + 1);
    const y = H / 2 + (randInt(8) - 4);
    const rotate = randInt(40) - 20; // -20° ~ 20°
    const size = 26 + randInt(8);
    const color = COLORS[randInt(COLORS.length)];
    chars.push(
      `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="bold" fill="${color}" text-anchor="middle" transform="rotate(${rotate} ${x} ${y})">${code[i]}</text>`,
    );
  }

  // 干扰线
  const lines: string[] = [];
  for (let i = 0; i < 4; i++) {
    const x1 = randInt(W);
    const y1 = randInt(H);
    const x2 = randInt(W);
    const y2 = randInt(H);
    const color = COLORS[randInt(COLORS.length)];
    lines.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.2" opacity="0.5"/>`,
    );
  }

  // 噪点
  const dots: string[] = [];
  for (let i = 0; i < 40; i++) {
    const cx = randInt(W);
    const cy = randInt(H);
    const r = Math.random() * 1.6 + 0.4;
    dots.push(`<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="#9ca3af" opacity="0.6"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#f3f4f6"/>
  ${lines.join("")}
  ${chars.join("")}
  ${dots.join("")}
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
