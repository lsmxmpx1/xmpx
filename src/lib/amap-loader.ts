/* eslint-disable @typescript-eslint/no-explicit-any */
// 动态加载高德 JS API v2.0
// 文档：https://lbs.amap.com/api/javascript-api-v2/guide/abc/loading
// 安全密钥必须在脚本加载前设置 window._AMapSecurityConfig。

declare global {
  interface Window {
    _AMapSecurityConfig?: { securityJsCode: string };
    AMap?: any;
  }
}

let loadingPromise: Promise<any> | null = null;

export function loadAMap(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("AMap 仅可在浏览器环境加载"));
  }
  const key = process.env.NEXT_PUBLIC_AMAP_JS_KEY;
  if (!key) {
    return Promise.reject(new Error("未配置高德 JS Key（NEXT_PUBLIC_AMAP_JS_KEY）"));
  }
  if (window.AMap) {
    return Promise.resolve(window.AMap);
  }
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    window._AMapSecurityConfig = {
      securityJsCode: process.env.NEXT_PUBLIC_AMAP_JS_CODE || "",
    };
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(
      key
    )}&plugin=AMap.Scale,AMap.ToolBar,AMap.Geolocation`;
    script.async = true;
    script.onload = () => {
      if (window.AMap) resolve(window.AMap);
      else reject(new Error("高德地图加载完成但未找到 AMap 对象"));
    };
    script.onerror = () => reject(new Error("高德地图脚本加载失败，请检查网络或 Key"));
    document.head.appendChild(script);
  });
  return loadingPromise;
}

export function isAMapReady(): boolean {
  return typeof window !== "undefined" && !!window.AMap;
}
