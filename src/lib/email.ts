import nodemailer from "nodemailer";
import { prisma } from "./prisma";

export interface EmailResult {
  success: boolean;
  error?: string;
  dev?: boolean;
}

/** 读取邮件服务器配置，若不存在则创建一条默认（dev）记录 */
export async function getEmailConfig() {
  let cfg = await prisma.emailConfig.findFirst();
  if (!cfg) {
    cfg = await prisma.emailConfig.create({ data: {} });
  }
  return cfg;
}

/**
 * 发送邮件。未启用真实 SMTP 时走开发模式：将内容打印到控制台，便于本地调试。
 * 启用后通过 nodemailer 连接配置的 SMTP 服务器发送。
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<EmailResult> {
  const cfg = await getEmailConfig();

  if (!cfg.enabled || !cfg.host || !cfg.user || !cfg.pass) {
    const plain = opts.text || opts.html.replace(/<[^>]+>/g, "");
    console.log(
      `\n[EMAIL DEV] 邮件已发送到 ${opts.to}\n主题: ${opts.subject}\n内容:\n${plain}\n`,
    );
    return { success: true, dev: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    });

    await transporter.sendMail({
      from: cfg.from || cfg.user,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "邮件发送失败" };
  }
}

/** 找回密码邮件模板 */
export function buildResetMailHtml(code: string, siteName = "厦门培训网"): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937">
  <h2 style="margin:0 0 16px;font-size:20px">${siteName} · 找回密码</h2>
  <p style="font-size:14px;line-height:1.6;margin:0 0 16px">您好，我们收到了您的密码重置请求。请使用以下验证码完成密码修改（5 分钟内有效）：</p>
  <div style="font-size:28px;font-weight:700;letter-spacing:6px;background:#f3f4f6;border-radius:10px;padding:16px;text-align:center;color:#2563eb;margin:0 0 16px">${code}</div>
  <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0">如非本人操作，请忽略此邮件，您的密码不会变更。</p>
</div>`;
}

/** 绑定/换绑邮箱邮件模板 */
export function buildBindMailHtml(code: string, siteName = "厦门培训网"): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937">
  <h2 style="margin:0 0 16px;font-size:20px">${siteName} · 绑定邮箱</h2>
  <p style="font-size:14px;line-height:1.6;margin:0 0 16px">您好，我们收到了您的邮箱绑定 / 换绑请求。请使用以下验证码完成验证（5 分钟内有效）：</p>
  <div style="font-size:28px;font-weight:700;letter-spacing:6px;background:#f3f4f6;border-radius:10px;padding:16px;text-align:center;color:#2563eb;margin:0 0 16px">${code}</div>
  <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0">如非本人操作，请忽略此邮件，您的邮箱不会被更改。</p>
</div>`;
}
