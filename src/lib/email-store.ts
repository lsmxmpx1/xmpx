/**
 * 邮箱验证码存储（数据库持久化，兼容 Vercel Serverless 多实例）
 * 底层实现见 verification-store.ts。邮箱统一小写存储，避免大小写不匹配查不到。
 */
import {
  generateCode as gen,
  canSend as cs,
  saveCode as sc,
  verifyCode as vc,
  clearCode as cc,
} from "./verification-store";

export function generateCode(): string {
  // 开发环境且未启用真实 SMTP 时返回固定验证码 123456
  const devFixed = process.env.NODE_ENV === "development" && !process.env.EMAIL_ENABLED;
  return gen(devFixed);
}

export function canSend(email: string) {
  return cs("EMAIL_RESET", email.trim().toLowerCase());
}

export function saveCode(email: string, code: string) {
  return sc("EMAIL_RESET", email.trim().toLowerCase(), code);
}

export function verifyCode(email: string, code: string) {
  return vc("EMAIL_RESET", email.trim().toLowerCase(), code);
}

export function clearCode(email: string) {
  return cc("EMAIL_RESET", email.trim().toLowerCase());
}

// ─── 注册验证码（EMAIL_REGISTER） ───
// 用于注册时校验邮箱所有权。与 EMAIL_RESET 区分，避免找回密码与注册流程互相覆盖验证码。

export function canSendRegister(email: string) {
  return cs("EMAIL_REGISTER", email.trim().toLowerCase());
}

export function saveCodeRegister(email: string, code: string) {
  return sc("EMAIL_REGISTER", email.trim().toLowerCase(), code);
}

export function verifyCodeRegister(email: string, code: string) {
  return vc("EMAIL_REGISTER", email.trim().toLowerCase(), code);
}
