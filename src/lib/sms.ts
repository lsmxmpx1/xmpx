import crypto from "crypto";
import { prisma } from "./prisma";

export interface SmsResult {
  success: boolean;
  error?: string;
}

/** 读取短信网关配置，若不存在则创建一条默认（dev）记录 */
export async function getSmsConfig() {
  let cfg = await prisma.smsConfig.findFirst();
  if (!cfg) {
    cfg = await prisma.smsConfig.create({ data: {} });
  }
  return cfg;
}

/** 发送短信验证码，按配置选择网关 */
export async function sendSms(phone: string, code: string): Promise<SmsResult> {
  const cfg = await getSmsConfig();

  if (!cfg.enabled) {
    // 网关未启用：开发模式打印到控制台，便于本地调试
    console.log(`[SMS DEV] 验证码已发送到 ${phone}: ${code}`);
    return { success: true };
  }

  switch (cfg.provider) {
    case "aliyun":
      return sendAliyun(cfg, phone, code);
    case "tencent":
      return sendTencent(cfg, phone, code);
    default:
      console.log(`[SMS DEV] 验证码已发送到 ${phone}: ${code}`);
      return { success: true };
  }
}

/* ------------------------- 阿里云短信 ------------------------- */

function aliyunPercentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/\+/g, "%20")
    .replace(/\*/g, "%2A")
    .replace(/%7E/g, "~");
}

async function sendAliyun(
  cfg: {
    accessKeyId?: string | null;
    accessKeySecret?: string | null;
    signName?: string | null;
    templateCode?: string | null;
    endpoint?: string | null;
  },
  phone: string,
  code: string
): Promise<SmsResult> {
  const { accessKeyId, accessKeySecret, signName, templateCode, endpoint } = cfg;
  if (!accessKeyId || !accessKeySecret || !signName || !templateCode) {
    return { success: false, error: "阿里云短信配置不完整" };
  }

  const host = endpoint || "dysmsapi.aliyuncs.com";
  const params: Record<string, string> = {
    AccessKeyId: accessKeyId,
    Action: "SendSms",
    Format: "JSON",
    PhoneNumbers: phone,
    RegionId: "cn-hangzhou",
    SignName: signName,
    SignatureMethod: "HMAC-SHA1",
    SignatureNonce: crypto.randomUUID(),
    SignatureVersion: "1.0",
    TemplateCode: templateCode,
    TemplateParam: JSON.stringify({ code }),
    Timestamp: new Date().toISOString(),
    Version: "2017-05-25",
  };

  const sortedKeys = Object.keys(params).sort();
  const canonicalizedQuery = sortedKeys
    .map((k) => `${aliyunPercentEncode(k)}=${aliyunPercentEncode(params[k])}`)
    .join("&");
  const stringToSign = `GET&${aliyunPercentEncode("/")}&${aliyunPercentEncode(canonicalizedQuery)}`;
  const signature = crypto
    .createHmac("sha1", `${accessKeySecret}&`)
    .update(stringToSign)
    .digest("base64");

  const url = `https://${host}/?Signature=${aliyunPercentEncode(signature)}&${canonicalizedQuery}`;

  try {
    const res = await fetch(url);
    const data = (await res.json()) as { Code?: string; Message?: string };
    if (data.Code === "OK") return { success: true };
    return { success: false, error: data.Message || data.Code || "阿里云短信发送失败" };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "网络错误" };
  }
}

/* ------------------------- 腾讯云短信 ------------------------- */

async function sendTencent(
  cfg: {
    secretId?: string | null;
    secretKey?: string | null;
    sdkAppId?: string | null;
    templateId?: string | null;
    signName?: string | null;
    region?: string | null;
  },
  phone: string,
  code: string
): Promise<SmsResult> {
  const { secretId, secretKey, sdkAppId, templateId, signName, region } = cfg;
  if (!secretId || !secretKey || !sdkAppId || !templateId) {
    return { success: false, error: "腾讯云短信配置不完整" };
  }

  const host = "sms.tencentcloudapi.com";
  const service = "sms";
  const action = "SendSms";
  const version = "2021-01-11";
  const timestamp = Math.floor(Date.now() / 1000);

  const payload = JSON.stringify({
    PhoneNumberSet: [`+86${phone}`],
    SmsSdkAppId: sdkAppId,
    SignName: signName || "",
    TemplateId: templateId,
    TemplateParamSet: [code],
  });

  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
  const hashedPayload = crypto.createHash("sha256").update(payload).digest("hex");
  const canonicalRequest = `POST\n/\n\ncontent-type:application/json; charset=utf-8\nhost:${host}\n\ncontent-type;host\n${hashedPayload}`;
  const credentialScope = `${date}/${service}/tc3_request`;
  const hashedCanonical = crypto.createHash("sha256").update(canonicalRequest).digest("hex");
  const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${hashedCanonical}`;

  const secretDate = crypto.createHmac("sha256", `TC3${secretKey}`).update(date).digest();
  const secretService = crypto.createHmac("sha256", secretDate).update(service).digest();
  const secretSigning = crypto.createHmac("sha256", secretService).update("tc3_request").digest();
  const signature = crypto.createHmac("sha256", secretSigning).update(stringToSign).digest("hex");

  const authorization = `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=content-type;host, Signature=${signature}`;

  try {
    const res = await fetch(`https://${host}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Host: host,
        "X-TC-Action": action,
        "X-TC-Timestamp": String(timestamp),
        "X-TC-Version": version,
        "X-TC-Region": region || "ap-guangzhou",
        Authorization: authorization,
      },
      body: payload,
    });
    const data = (await res.json()) as {
      Response?: { SendStatusSet?: Array<{ Code?: string; Message?: string }>; Error?: { Message?: string } };
    };
    const res0 = data?.Response?.SendStatusSet?.[0];
    if (res0 && res0.Code === "Ok") return { success: true };
    return { success: false, error: res0?.Message || data?.Response?.Error?.Message || "腾讯云短信发送失败" };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "网络错误" };
  }
}
