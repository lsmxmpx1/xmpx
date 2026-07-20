import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { buildMpOauthUrl, isMpConfigured } from "@/lib/wechat";
import WechatLoginClient from "./WechatLoginClient";

// 公众号网页授权需要从微信内浏览器发起，这里服务端先判断 UA
export const dynamic = "force-dynamic";

export default async function WechatLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const isReturning = "status" in sp || "code" in sp; // 回调返回，交给客户端完成登录

  const ua = (await headers()).get("user-agent") || "";
  const isWechat = /MicroMessenger/i.test(ua);

  // 微信内浏览器 + 已配置公众号 → 直接走网页授权 OAuth
  // （带参数二维码的 PC 方案不适用手机内浏览；OAuth 更适合微信内场景）
  if (isWechat && isMpConfigured() && !isReturning) {
    const origin = (await headers()).get("origin") || process.env.NEXTAUTH_URL || "";
    const redirectUri = `${origin}/api/auth/wechat/callback`;
    redirect(buildMpOauthUrl(redirectUri, crypto.randomUUID()));
  }

  return <WechatLoginClient />;
}
