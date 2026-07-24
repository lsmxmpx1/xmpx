/**
 * 验证码存储（数据库持久化，兼容 Vercel Serverless 多实例）
 *
 * 原实现用内存 Map，在 Serverless 多实例/冷启动下验证码会丢失，导致
 * 「手机验证码登录 / 邮箱找回密码 / 换绑邮箱」在线上必失败。现统一落库到
 * VerificationCode 表，按 (type, target) 唯一约束，保留原冷却/过期/次数限制。
 *
 * type 取值：SMS(手机验证码登录) | EMAIL_RESET(邮箱找回密码) | EMAIL_BIND(换绑邮箱)
 */
import { prisma } from "./prisma";

export type CodeType = "SMS" | "EMAIL_RESET" | "EMAIL_BIND";

const CODE_EXPIRE_MS = 5 * 60 * 1000; // 5 分钟过期
const MAX_ATTEMPTS = 5; // 最多验证 5 次
const SEND_COOLDOWN_MS = 60 * 1000; // 60 秒发送冷却

export function generateCode(devFixed: boolean): string {
  // 开发环境返回固定验证码 123456，生产环境随机生成 6 位数字
  if (devFixed) return "123456";
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function canSend(type: CodeType, target: string) {
  const rec = await prisma.verificationCode.findUnique({
    where: { type_target: { type, target } },
  });
  if (rec && Date.now() - rec.createdAt.getTime() < SEND_COOLDOWN_MS) {
    const waitSeconds = Math.ceil(
      (SEND_COOLDOWN_MS - (Date.now() - rec.createdAt.getTime())) / 1000,
    );
    return { ok: false as const, waitSeconds };
  }
  return { ok: true as const, waitSeconds: 0 };
}

export async function saveCode(type: CodeType, target: string, code: string) {
  const expiresAt = new Date(Date.now() + CODE_EXPIRE_MS);
  // upsert：同一 (type, target) 只保留一条，重发即覆盖并重置过期/次数/冷却
  await prisma.verificationCode.upsert({
    where: { type_target: { type, target } },
    create: { type, target, code, expiresAt, attempts: 0 },
    update: { code, expiresAt, attempts: 0, createdAt: new Date() },
  });
}

export async function verifyCode(
  type: CodeType,
  target: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  const rec = await prisma.verificationCode.findUnique({
    where: { type_target: { type, target } },
  });

  if (!rec) {
    return { success: false, error: "请先获取验证码" };
  }

  if (rec.expiresAt.getTime() < Date.now()) {
    await prisma.verificationCode
      .delete({ where: { type_target: { type, target } } })
      .catch(() => {});
    return { success: false, error: "验证码已过期，请重新获取" };
  }

  if (rec.attempts >= MAX_ATTEMPTS) {
    await prisma.verificationCode
      .delete({ where: { type_target: { type, target } } })
      .catch(() => {});
    return { success: false, error: "验证次数过多，请重新获取" };
  }

  // 记录一次尝试
  await prisma.verificationCode.update({
    where: { type_target: { type, target } },
    data: { attempts: rec.attempts + 1 },
  });

  if (rec.code !== code) {
    return { success: false, error: "验证码错误" };
  }

  // 验证成功后删除，防止重复使用
  await prisma.verificationCode
    .delete({ where: { type_target: { type, target } } })
    .catch(() => {});
  return { success: true };
}

export async function clearCode(type: CodeType, target: string) {
  await prisma.verificationCode
    .delete({ where: { type_target: { type, target } } })
    .catch(() => {});
}
