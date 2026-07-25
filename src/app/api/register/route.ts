import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const PUZZLE_TOLERANCE = 8; // 拼图 X 坐标容差（px）

/** 清除拼图验证码 Cookie 的辅助函数 */
function clearPuzzleCookie(res: NextResponse) {
  res.cookies.set("puzzle_x", "", { path: "/", maxAge: 0 });
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password, confirmPassword, puzzleX } = await req.json();

    // ─── 校验拼图滑块验证码（防机器人恶意注册） ───
    const cookieX = req.cookies.get("puzzle_x")?.value;
    if (cookieX === undefined || puzzleX === undefined || puzzleX === null) {
      const fail = NextResponse.json({ error: "请完成拼图验证" }, { status: 400 });
      clearPuzzleCookie(fail);
      return fail;
    }

    const correctX = Number(cookieX);
    const submittedX = Number(puzzleX);
    if (Math.abs(correctX - submittedX) > PUZZLE_TOLERANCE) {
      console.log(`[register] 拼图验证失败: 提交=${submittedX}, 正确=${correctX}, 差值=${Math.abs(correctX - submittedX)}`);
      const fail = NextResponse.json({ error: "验证失败，请重新拖动滑块完成拼图" }, { status: 400 });
      clearPuzzleCookie(fail);
      return fail;
    }
    // 拼图验证通过，清除 Cookie（一次性使用）
    // （后续每个错误响应也会清除）

    // ─── 密码校验 ───
    if (!password || password.length < 6) {
      const fail = NextResponse.json({ error: "密码至少6位" }, { status: 400 });
      clearPuzzleCookie(fail);
      return fail;
    }

    if (password !== confirmPassword) {
      const fail = NextResponse.json({ error: "两次输入的密码不一致" }, { status: 400 });
      clearPuzzleCookie(fail);
      return fail;
    }

    // ─── 账号唯一性 ───
    if (!email && !phone) {
      const fail = NextResponse.json({ error: "邮箱或手机号至少填一个" }, { status: 400 });
      clearPuzzleCookie(fail);
      return fail;
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          phone ? { phone } : {},
        ].filter((c) => Object.keys(c).length > 0),
      },
    });

    if (existing) {
      const fail = NextResponse.json({ error: "该邮箱或手机号已注册" }, { status: 400 });
      clearPuzzleCookie(fail);
      return fail;
    }

    // ─── 创建用户 ───
    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        password: hashed,
        roles: "USER",
        role: "USER",
      },
    });

    const ok = NextResponse.json({ success: true, userId: user.id });
    clearPuzzleCookie(ok);
    return ok;
  } catch (e) {
    console.error("[register]", e);
    const fail = NextResponse.json({ error: "注册失败，请稍后重试" }, { status: 500 });
    clearPuzzleCookie(fail);
    return fail;
  }
}
