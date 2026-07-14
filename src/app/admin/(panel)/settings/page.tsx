import { getSmsConfig } from "@/lib/sms";
import { saveSmsConfig } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  const cfg = await getSmsConfig();

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-bold text-gray-800 mb-1">系统设置</h2>
      <p className="text-gray-500 text-sm mb-6">短信网关配置（用于注册 / 登录验证码发送）</p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-4 flex items-center gap-2 text-sm">
          <span className={`w-2.5 h-2.5 rounded-full ${cfg.enabled ? "bg-green-500" : "bg-gray-300"}`} />
          <span className="text-gray-600">
            当前状态：{cfg.enabled ? `已启用（${cfg.provider}）` : "未启用（开发模式，验证码打印到控制台）"}
          </span>
        </div>

        <form action={saveSmsConfig} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">短信服务商</label>
              <select name="provider" defaultValue={cfg.provider} className="input-field">
                <option value="dev">开发模式（不真正发送）</option>
                <option value="aliyun">阿里云短信</option>
                <option value="tencent">腾讯云短信</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" name="enabled" defaultChecked={cfg.enabled} className="w-4 h-4" />
                启用网关发送（取消则走开发模式）
              </label>
            </div>
          </div>

          <fieldset className="border border-gray-200 rounded-lg p-4">
            <legend className="text-sm font-semibold text-gray-700 px-2">阿里云短信</legend>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">AccessKeyId</label>
                <input name="accessKeyId" defaultValue={cfg.accessKeyId || ""} className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">AccessKeySecret</label>
                <input name="accessKeySecret" type="password" defaultValue={cfg.accessKeySecret || ""} className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">签名（SignName）</label>
                <input name="signName" defaultValue={cfg.signName || ""} className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">模板 Code（TemplateCode）</label>
                <input name="templateCode" defaultValue={cfg.templateCode || ""} className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Endpoint</label>
                <input name="endpoint" defaultValue={cfg.endpoint || "dysmsapi.aliyuncs.com"} className="input-field" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              模板示例：验证码为 {"${code}"}，模板变量名请保持为 <code>code</code>。
            </p>
          </fieldset>

          <fieldset className="border border-gray-200 rounded-lg p-4">
            <legend className="text-sm font-semibold text-gray-700 px-2">腾讯云短信</legend>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">SecretId</label>
                <input name="secretId" defaultValue={cfg.secretId || ""} className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">SecretKey</label>
                <input name="secretKey" type="password" defaultValue={cfg.secretKey || ""} className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">SdkAppId</label>
                <input name="sdkAppId" defaultValue={cfg.sdkAppId || ""} className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">模板 ID（TemplateId）</label>
                <input name="templateId" defaultValue={cfg.templateId || ""} className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Region</label>
                <input name="region" defaultValue={cfg.region || "ap-guangzhou"} className="input-field" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">模板参数将传入单个变量：验证码数字。</p>
          </fieldset>

          <div className="flex justify-end">
            <button type="submit" className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
              保存配置
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
