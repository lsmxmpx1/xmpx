/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { loadAMap } from "@/lib/amap-loader";
import { amapConfigured, XIAMEN_CENTER } from "@/lib/amap";

export interface MapPoint {
  id?: string;
  lng: number;
  lat: number;
  title?: string;
  address?: string;
  phone?: string;
}

interface Props {
  points: MapPoint[];
  center?: { lng: number; lat: number };
  zoom?: number;
  height?: number | string;
  // 是否显示「使用我的位置」按钮（用于列表页「离我最近」筛选）
  showMyLocation?: boolean;
  onLocateMe?: (coords: { lng: number; lat: number }) => void;
  onMarkerClick?: (point: MapPoint) => void;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function AMapMap({
  points,
  center,
  zoom = 11,
  height = 360,
  showMyLocation,
  onLocateMe,
  onMarkerClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const validPoints = points.filter(
    (p) => Number.isFinite(p.lng) && Number.isFinite(p.lat)
  );

  // 初始加载地图
  useEffect(() => {
    let cancelled = false;
    if (!amapConfigured()) {
      setErr(
        "尚未配置高德地图 Key，地图暂不可用。请在 .env.local 配置 NEXT_PUBLIC_AMAP_JS_KEY 后重启服务。申请地址：https://console.amap.com/"
      );
      return;
    }
    loadAMap()
      .then((AMap) => {
        if (cancelled || !containerRef.current) return;
        const c =
          center ??
          (validPoints[0]
            ? { lng: validPoints[0].lng, lat: validPoints[0].lat }
            : XIAMEN_CENTER);
        const map = new AMap.Map(containerRef.current, {
          zoom,
          center: [c.lng, c.lat],
          viewMode: "2D",
        });
        map.addControl(new AMap.Scale());
        map.addControl(new AMap.ToolBar());
        mapRef.current = map;
        drawMarkers(AMap, map, validPoints, onMarkerClick);
      })
      .catch((e) => setErr(e?.message || "地图加载失败"));
    return () => {
      cancelled = true;
      try {
        mapRef.current?.destroy?.();
      } catch {
        /* ignore */
      }
      mapRef.current = null;
      markersRef.current = [];
    };
    // 仅首次加载地图实例
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 外部 points 变化（如筛选后）时重绘 marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    drawMarkers(window.AMap, map, validPoints, onMarkerClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  const drawMarkers = useCallback(
    (AMap: any, map: any, pts: MapPoint[], onClick?: (p: MapPoint) => void) => {
      markersRef.current.forEach((m) => map.remove(m));
      markersRef.current = [];
      if (!pts.length) return;
      const positions: any[] = [];
      pts.forEach((p) => {
        const marker = new AMap.Marker({
          position: [p.lng, p.lat],
          title: p.title || "",
          extData: p,
          anchor: "bottom-center",
        });
        if (p.title) {
          marker.setLabel({
            direction: "top",
            offset: new AMap.Pixel(0, -30),
            content: `<div style="padding:2px 8px;background:#fff;border:1px solid #ff6a00;border-radius:6px;font-size:12px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.15);">${escapeHtml(
              p.title
            )}</div>`,
          });
        }
        if (onClick) {
          marker.on("click", () => onClick(p));
        }
        map.add(marker);
        markersRef.current.push(marker);
        positions.push([p.lng, p.lat]);
      });
      if (positions.length > 1) {
        map.setFitView(markersRef.current, false, [50, 50, 50, 50]);
      } else if (positions.length === 1) {
        map.setZoomAndCenter(zoom, positions[0]);
      }
    },
    [zoom]
  );

  // 使用我的位置（高德 Geolocation 插件，返回 GCJ-02 坐标）
  const handleLocateMe = () => {
    const map = mapRef.current;
    if (!map) return;
    setLocating(true);
    map.plugin(["AMap.Geolocation"], () => {
      const geo = new window.AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 8000,
      });
      geo.getCurrentPosition((status: string, result: any) => {
        setLocating(false);
        if (status === "complete" && result.position) {
          const coords = {
            lng: result.position.lng,
            lat: result.position.lat,
          };
          map.setZoomAndCenter(14, [coords.lng, coords.lat]);
          onLocateMe?.(coords);
        } else {
          setErr("获取位置失败，请允许浏览器定位权限后重试");
        }
      });
    });
  };

  if (err) {
    return (
      <div
        className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500"
        style={{ height }}
      >
        {err}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        style={{ height, width: "100%" }}
        className="rounded-lg overflow-hidden border border-gray-200"
      />
      {showMyLocation && onLocateMe && (
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="absolute right-3 top-3 z-10 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-rose-600 shadow border border-rose-200 hover:bg-rose-50 disabled:opacity-60"
        >
          {locating ? "定位中…" : "📍 离我最近"}
        </button>
      )}
    </div>
  );
}
