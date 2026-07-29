import { NextRequest, NextResponse } from "next/server";
import { sendEmail, getEmailConfig } from "@/lib/email";

/**
 * POST /api/email/test
 * 管理员测试邮件发送：向指定邮箱发送一封测试邮件，返回详细结果（含错误信息）。
 * 仅用于后台"发送测试邮件"按钮，需管理员权限。
 */
export async function POST(req: NextRequest) {
  try {
    const { to } = await req.json();

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: "请输入正确的收件邮箱" }, { status: 400 });
    }

    const cfg = await getEmailConfig();
    if (!cfg.enabled) {
      return NextResponse.json({ error: "SMTP 未启用，请先启用真实发送并保存配置" }, { status: 400 });
    }
    if (!cfg.host || !cfg.user || !cfg.pass) {
      return NextResponse.json({ error: "SMTP 配置不完整（缺少主机/账号/密码）" }, { status: 400 });
    }

    const result = await sendEmail({
      to,
      subject: "厦门培训网 · 邮件配置测试",
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937">
  <h2 style="margin:0 0 16px">✅ 邮件发送成功</h2>
  <p style="font-size:14px;line-height:1.6;margin:0 0 8px">如果您收到这封邮件，说明 SMTP 配置正确，邮件功能可以正常使用。</p>
  <p style="font-size:13px;color:#6b7280">发件服务器：${cfg.host}:${cfg.port}（${cfg.secure ? "SSL" : "STARTTLS"}）</p>
  <p style="font-size:13px;color:#6b7280">发送时间：${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</p>
</div>`,
      text: "邮件配置测试成功！如果您收到这封邮件，说明 SMTP 配置正确。",
    });

    if (result.success) {
      return NextResponse.json({ success: true, message: `测试邮件已发送至 ${to}，请查收` });
    } else {
      return NextResponse.json(
        { success: false, error: `发送失败：${result.error}` },
        { status: 500 },
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "未知错误";
    console.error(`[EMAIL TEST] ${msg}`);
    return NextResponse.json({ error: `测试失败：${msg}` }, { status: 500 });
  }
}
