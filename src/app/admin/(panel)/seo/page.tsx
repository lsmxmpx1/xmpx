"use client";

import { useState, useEffect, useCallback } from "react";
import { SITE_URL } from "@/lib/constants";

interface PushLog {
  id: string;
  type: string;
  count: number;
  success: number;
  remain: number | null;
  error: string | null;
  triggeredBy: string;
  createdAt: string;
  urlList?: string[]; // 该条日志推送的 URL 列表
}

interface Stats {
  todayPushed: number;
  todayRemain: number | null;
  pendingCount: number;
  pushedCount?: number; // 已成功推送去重数
  pendingUrls: string[];
}

type Tab = "api" | "sitemap" | "manual";

export default function AdminSeoPage() {
  const [tab, setTab] = useState<Tab>("api");
  const [logs, setLogs] = useState<PushLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pushing, setPushing] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    submitted?: number;
    successCount?: number;
    remain?: number;
    error?: string;
    message?: string;
  } | null>(null);
  const [sinceDays, setSinceDays] = useState(1);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [logDetail, setLogDetail] = useState<string[] | null>(null);

  // 加载推送历史和统计
  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/baidu-push");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setStats(data.stats || null);
      }
    } catch (e) {
      console.error("加载失败", e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 执行推送
  const handlePush = async (triggeredBy: string = "manual") => {
    setPushing(true);
    setResult(null);
    try {
      const since = new Date(Date.now() - sinceDays * 86400000).toISOString();
      const res = await fetch("/api/admin/baidu-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ since, triggeredBy }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success !== false) loadData();
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : "请求失败" });
    }
    setPushing(false);
  };

  // 手动提交 URL
  const [manualUrls, setManualUrls] = useState("");
  const handleManualPush = async () => {
    const urls = manualUrls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean)
      .map((u) => (u.startsWith("http") ? u : `${SITE_URL}${u}`));
    if (urls.length === 0) {
      setResult({ error: "请输入至少一个 URL" });
      return;
    }
    setPushing(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/baidu-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls, triggeredBy: "manual" }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success !== false) loadData();
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : "请求失败" });
    }
    setPushing(false);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  // 点击成功数展开/收起该条日志的 URL 明细
  const toggleLogDetail = async (log: PushLog) => {
    if (expandedLogId === log.id) {
      setExpandedLogId(null);
      setLogDetail(null);
      return;
    }
    setExpandedLogId(log.id);
    // 列表接口已返回 urlList，优先直接用，避免二次请求
    if (log.urlList && log.urlList.length > 0) {
      setLogDetail(log.urlList);
      return;
    }
    setLogDetail(null); // 加载中
    try {
      const res = await fetch(`/api/admin/baidu-push?logId=${log.id}`);
      if (res.ok) {
        const data = await res.json();
        setLogDetail(data.urls || []);
      } else {
        setLogDetail([]);
      }
    } catch {
      setLogDetail([]);
    }
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-bold text-gray-800 mb-1">SEO 推送管理</h2>
      <p className="text-gray-500 text-sm mb-6">
        百度搜索资源平台主动推送 — 将新增内容快速提交至百度收录
      </p>

      {/* Tab 切换 */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { key: "api" as Tab, label: "API 提交" },
          { key: "sitemap" as Tab, label: "sitemap" },
          { key: "manual" as Tab, label: "手动提交" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-primary-600 text-white shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 统计概览 */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-primary-600">{stats.todayPushed}</div>
            <div className="text-xs text-gray-500 mt-1">今日已推送</div>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.pendingCount}</div>
            <div className="text-xs text-gray-500 mt-1">待推送页面</div>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.pushedCount ?? 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">已推送去重</div>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {stats.todayRemain ?? "-"}
            </div>
            <div className="text-xs text-gray-500 mt-1">今日剩余配额</div>
          </div>
        </div>
      )}

      {/* API 提交 Tab */}
      {tab === "api" && (
        <div className="bg-white rounded-xl border p-6 space-y-5">
          <div>
            <h3 className="font-semibold mb-3">推送接口</h3>
            <code className="block text-xs bg-gray-50 p-3 rounded-lg break-all text-gray-600">
              http://data.zz.baidu.com/urls?site=www.xmpx.cn&amp;token=PEIKdvyhZCyQrWI3
            </code>
          </div>

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                推送范围
              </label>
              <select
                value={sinceDays}
                onChange={(e) => setSinceDays(Number(e.target.value))}
                className="input-field"
              >
                <option value={1}>最近 1 天新增</option>
                <option value={3}>最近 3 天新增</option>
                <option value={7}>最近 7 天新增</option>
                <option value={30}>最近 30 天新增</option>
                <option value={0}>全部已发布内容</option>
              </select>
            </div>
            <button
              onClick={() => handlePush("manual")}
              disabled={pushing}
              className="btn-primary px-8 py-2.5 disabled:opacity-50"
            >
              {pushing ? "推送中..." : "立即推送"}
            </button>
          </div>

          {/* 推送结果 */}
          {result && (
            <div
              className={`rounded-lg p-4 text-sm ${
                result.error
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              {result.error ? (
                <>
                  <span className="font-semibold">推送失败：</span>
                  {result.error}
                </>
              ) : result.message ? (
                result.message
              ) : (
                <>
                  推送成功！已提交{" "}
                  <strong>{result.submitted}</strong> 条，百度成功收录{" "}
                  <strong>{result.successCount}</strong> 条
                  {result.remain != null && (
                    <>，今日剩余配额 <strong>{result.remain}</strong></>
                  )}
                </>
              )}
            </div>
          )}

          {/* 待推送预览（已成功推送的自动排除） */}
          {stats?.pendingUrls && stats.pendingUrls.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                待推送 URL（已排除 {stats.pushedCount ?? 0} 条已推送成功的，剩余{" "}
                {stats.pendingCount} 条）
              </h4>
              <div className="bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto">
                {stats.pendingUrls.slice(0, 20).map((u, i) => (
                  <div key={i} className="text-xs text-gray-600 py-0.5 font-mono truncate">
                    {u}
                  </div>
                ))}
                {stats.pendingUrls.length > 20 && (
                  <div className="text-xs text-gray-400 italic pt-1">
                    ... 还有 {stats.pendingUrls.length - 20} 条
                  </div>
                )}
              </div>
            </div>
          )}
          {stats?.pendingUrls && stats.pendingUrls.length === 0 && stats.pushedCount !== undefined && stats.pushedCount > 0 && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
              所有公开页面均已推送成功，暂无待推送内容。
            </div>
          )}
        </div>
      )}

      {/* sitemap Tab */}
      {tab === "sitemap" && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h3 className="font-semibold">Sitemap 提交</h3>
          <p className="text-sm text-gray-500">
            站点地图地址（可在百度资源平台手动提交或配置自动更新）：
          </p>
          <div className="flex gap-3">
            <code className="flex-1 text-sm bg-gray-50 px-4 py-2.5 rounded-lg block">
              https://www.xmpx.cn/sitemap.xml
            </code>
            <a
              href="https://www.xmpx.cn/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-6 py-2.5"
            >
              查看
            </a>
          </div>
          <div className="text-xs text-gray-400 space-y-1 mt-3">
            <p>• Sitemap 由 /src/app/sitemap.ts 自动生成，包含所有公开页面</p>
            <p>• 可在百度资源平台 → 普通收录 → sitemap 中提交此地址</p>
            <p>• 建议配合 API 主动推送使用：API 用于即时通知，Sitemap 作为兜底</p>
          </div>
        </div>
      )}

      {/* 手动提交 Tab */}
      {tab === "manual" && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h3 className="font-semibold">手动提交 URL</h3>
          <p className="text-sm text-gray-500">
            每行一个 URL（支持相对路径，自动补全域名）
          </p>
          <textarea
            value={manualUrls}
            onChange={(e) => setManualUrls(e.target.value)}
            placeholder={`https://www.xmpx.cn/articles/xxx\n/courses/yyy\n/institutions/zzz`}
            rows={10}
            className="input-field font-mono text-sm"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">
              共 {(manualUrls.match(/\S+/g) || []).length} 个 URL
            </span>
            <button
              onClick={handleManualPush}
              disabled={pushing || !manualUrls.trim()}
              className="btn-primary px-8 py-2.5 disabled:opacity-50"
            >
              {pushing ? "推送中..." : "提交推送"}
            </button>
          </div>

          {/* 手动推送结果复用 */}
          {result && tab === "manual" && (
            <div
              className={`rounded-lg p-4 text-sm ${
                result.error
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              {result.error ? (
                <>推送失败：{result.error}</>
              ) : (
                <>
                  成功！提交 {result.submitted} 条，收录 {result.successCount} 条
                  {result.remain != null && `，剩余 ${result.remain}`}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* 推送历史 */}
      <div className="mt-8">
        <h3 className="font-semibold mb-3">推送历史</h3>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">暂无推送记录</p>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">时间</th>
                  <th className="px-4 py-3 font-medium text-gray-600">类型</th>
                  <th className="px-4 py-3 font-medium text-gray-600">提交数</th>
                  <th className="px-4 py-3 font-medium text-gray-600">成功数</th>
                  <th className="px-4 py-3 font-medium text-gray-600">剩余配额</th>
                  <th className="px-4 py-3 font-medium text-gray-600">触发方式</th>
                  <th className="px-4 py-3 font-medium text-gray-600">状态</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <>
                    <tr key={log.id} className="border-t border-gray-100">
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                        {formatTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600">
                          {log.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {log.count > 0 ? (
                          <button
                            onClick={() => toggleLogDetail(log)}
                            className="hover:text-primary-600 hover:underline cursor-pointer bg-transparent border-none p-0 text-left"
                            title="点击查看推送 URL 明细"
                          >
                            {log.count}
                          </button>
                        ) : (
                          <span className="text-gray-400">{log.count}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {log.success > 0 ? (
                          <button
                            onClick={() => toggleLogDetail(log)}
                            className="font-medium text-green-600 hover:text-green-700 hover:underline cursor-pointer bg-transparent border-none p-0 text-left"
                            title="点击查看推送明细"
                          >
                            {log.success}
                          </button>
                        ) : (
                          <span className="text-gray-400">{log.success}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">
                        {log.remain ?? "-"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            log.triggeredBy === "cron" || log.triggeredBy === "vercel-cron"
                              ? "bg-purple-50 text-purple-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {log.triggeredBy === "cron" || log.triggeredBy === "vercel-cron"
                            ? "定时任务"
                            : "手动"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-top">
                        {log.error ? (
                          <div className="text-red-500 text-xs max-w-xs">
                            <span className="font-medium">失败</span>
                            <span className="block text-red-400 truncate" title={log.error}>
                              {log.error}
                            </span>
                          </div>
                        ) : log.count === 0 ? (
                          <span className="text-green-500 text-xs">成功（无新增）</span>
                        ) : (
                          <span className="text-green-500 text-xs">成功</span>
                        )}
                      </td>
                    </tr>
                    {/* 展开的 URL 明细行 */}
                    {expandedLogId === log.id && (
                      <tr key={`${log.id}-detail`} className="border-t border-blue-100 bg-blue-50/30">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="text-xs text-gray-500 mb-1.5 font-medium">
                            推送明细（{logDetail?.length ?? "..."} 条）
                          </div>
                          {logDetail === null ? (
                            <div className="text-xs text-gray-400">加载中...</div>
                          ) : logDetail.length === 0 ? (
                            <div className="text-xs text-gray-400">无 URL 记录</div>
                          ) : (
                            <div className="bg-white rounded-lg border p-3 max-h-48 overflow-y-auto space-y-0.5">
                              {logDetail.map((u, i) => (
                                <div key={i} className="text-xs text-gray-600 font-mono truncate flex items-center gap-2">
                                  <span className="text-green-500 shrink-0">✓</span>
                                  <a
                                    href={u}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-primary-600 hover:underline truncate"
                                  >
                                    {u}
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
