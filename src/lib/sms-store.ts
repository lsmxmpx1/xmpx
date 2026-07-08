/**
 * SMS 验证码内存存储
 * 生产环境可替换为 Redis 或数据库存储
 */

interface SmsRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

const store = new Map<string, SmsRecord>();

// 每个手机号每分钟最多发送 1 次
const sendCooldown = new Map<string, number>();

const CODE_EXPIRE_MS = 5 * 60 * 1000; // 5 分钟过期
const MAX_ATTEMPTS = 5; // 最多验证 5 次
const SEND_COOLDOWN_MS = 60 * 1000; // 60 秒冷却

export function generateCode(): string {
  // 开发环境返回固定验证码 123456，生产环境随机生成 6 位数字
  if (process.env.NODE_ENV === "development" && !process.env.SMS_PROVIDER) {
    return "123456";
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function canSend(phone: string): { ok: boolean; waitSeconds: number } {
  const last = sendCooldown.get(phone);
  if (last && Date.now() - last < SEND_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((SEND_COOLDOWN_MS - (Date.now() - last)) / 1000);
    return { ok: false, waitSeconds };
  }
  return { ok: true, waitSeconds: 0 };
}

export function saveCode(phone: string, code: string): void {
  store.set(phone, { code, expiresAt: Date.now() + CODE_EXPIRE_MS, attempts: 0 });
  sendCooldown.set(phone, Date.now());
}

export function verifyCode(phone: string, code: string): { success: boolean; error?: string } {
  const record = store.get(phone);

  if (!record) {
    return { success: false, error: "请先获取验证码" };
  }

  if (Date.now() > record.expiresAt) {
    store.delete(phone);
    return { success: false, error: "验证码已过期，请重新获取" };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    store.delete(phone);
    return { success: false, error: "验证次数过多，请重新获取" };
  }

  record.attempts++;

  if (record.code !== code) {
    return { success: false, error: "验证码错误" };
  }

  // 验证成功后删除，防止重复使用
  store.delete(phone);
  sendCooldown.delete(phone);
  return { success: true };
}

export function clearCode(phone: string): void {
  store.delete(phone);
  sendCooldown.delete(phone);
}
