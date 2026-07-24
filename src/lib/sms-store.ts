/**
 * 短信验证码存储（数据库持久化，兼容 Vercel Serverless 多实例）
 * 底层实现见 verification-store.ts
 */
import {
  generateCode as gen,
  canSend as cs,
  saveCode as sc,
  verifyCode as vc,
  clearCode as cc,
} from "./verification-store";

export function generateCode(): string {
  // 开发环境且无真实短信网关时返回固定验证码 123456
  const devFixed = process.env.NODE_ENV === "development" && !process.env.SMS_PROVIDER;
  return gen(devFixed);
}

export function canSend(phone: string) {
  return cs("SMS", phone);
}

export function saveCode(phone: string, code: string) {
  return sc("SMS", phone, code);
}

export function verifyCode(phone: string, code: string) {
  return vc("SMS", phone, code);
}

export function clearCode(phone: string) {
  return cc("SMS", phone);
}
