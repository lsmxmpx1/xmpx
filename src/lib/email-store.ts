/**
 * 邮箱验证码内存存储（找回密码用）
 * 生产环境可替换为 Redis 或数据库存储
 */

interface EmailRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

const store = new Map<string, EmailRecord>();

// 每个邮箱每分钟最多发送 1 次
const sendCooldown = new Map<string, number>();

const CODE_EXPIRE_MS = 5 * 60 * 1000; // 5 分钟过期
const MAX_ATTEMPTS = 5; // 最多验证 5 次
const SEND_COOLDOWN_MS = 60 * 1000; // 60 秒冷却

export function generateCode(): string {
  // 开发环境返回固定验证码 123456，生产环境随机生成 6 位数字
  if (process.env.NODE_ENV === "development" && !process.env.EMAIL_ENABLED) {
    return "123456";
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function canSend(email: string): { ok: boolean; waitSeconds: number } {
  const last = sendCooldown.get(email);
  if (last && Date.now() - last < SEND_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((SEND_COOLDOWN_MS - (Date.now() - last)) / 1000);
    return { ok: false, waitSeconds };
  }
  return { ok: true, waitSeconds: 0 };
}

export function saveCode(email: string, code: string): void {
  store.set(email, { code, expiresAt: Date.now() + CODE_EXPIRE_MS, attempts: 0 });
  sendCooldown.set(email, Date.now());
}

export function verifyCode(email: string, code: string): { success: boolean; error?: string } {
  const record = store.get(email);

  if (!record) {
    return { success: false, error: "请先获取验证码" };
  }

  if (Date.now() > record.expiresAt) {
    store.delete(email);
    return { success: false, error: "验证码已过期，请重新获取" };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    store.delete(email);
    return { success: false, error: "验证次数过多，请重新获取" };
  }

  record.attempts++;

  if (record.code !== code) {
    return { success: false, error: "验证码错误" };
  }

  // 验证成功后删除，防止重复使用
  store.delete(email);
  sendCooldown.delete(email);
  return { success: true };
}

export function clearCode(email: string): void {
  store.delete(email);
  sendCooldown.delete(email);
}
