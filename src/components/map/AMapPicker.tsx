/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { loadAMap } from "@/lib/amap-loader";
import { amapConfigured, XIAMEN_CENTER } from "@/lib/amap";

interface Props {
  address?: string;
  lng?: number | null;
  lat?: number | null;
  district?: string;
  onLocated?: (data: { lng: number; lat: number; address: string }) => void;
}

export default function AMapPicker({ address, lng, lat, district, onLocated }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [addr, setAddr] = useState(address || "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lng: number; lat: number } | null>(
    lng != null && lat != null ? { lng, lat } : null
  );
  const [showMap, setShowMap] = useState(false);
  const configured = amapConfigured();

  // 同步外部传入的地址/坐标
  useEffect(() => {
    setAddr(address || "");
  }, [address]);
  useEffect(() => {
    if (lng != null && lat != null) setCoords({ lng, lat });
  }, [lng, lat]);

  // 初始化地图（仅当展开且已配置 Key）
  useEffect(() => {
    if (!showMap || !configured) return;
    let cancelled = false;
    loadAMap()
      .then((AMap) => {
        if (cancelled || !containerRef.current) return;
        const center = coords ?? XIAMEN_CENTER;
        const map = new AMap.Map(containerRef.current, {
          zoom: coords ? 15 : 11,
          center: [center.lng, center.lat],
          viewMode: "2D",
        });
        map.addControl(new AMap.Scale());
        map.addControl(new AMap.ToolBar());
        mapRef.current = map;

        const place = (lo: number, la: number) => {
          if (markerRef.current) {
            markerRef.current.setPosition([lo, la]);
          } else {
            const m = new AMap.Marker({ position: [lo, la], draggable: true });
            m.on("dragend", () => {
              const p = m.getPosition();
              updateCoords(Number(p.lng), Number(p.lat));
            });
            map.add(m);
            markerRef.current = m;
          }
          map.setCenter([lo, la]);
        };

        if (coords) place(coords.lng, coords.lat);

        map.on("click", (e: any) => {
          const lo = Number(e.lnglat.getLng());
          const la = Number(e.lnglat.getLat());
          place(lo, la);
          updateCoords(lo, la);
        });
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
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap, configured]);

  const updateCoords = (lo: number, la: number) => {
    setCoords({ lng: lo, lat: la });
    setErr(null);
    onLocated?.({ lng: lo, lat: la, address: addr });
  };

  // 地理编码：地址 -> 经纬度（经过 /api/geocode，使用服务端 Web Key）
  const handleGeocode = async () => {
    if (!addr.trim()) {
      setErr("请先填写地址再定位");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/geocode?address=${encodeURIComponent(addr.trim())}&city=${encodeURIComponent(
          district || "厦门"
        )}`
      );
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "解析失败");
        return;
      }
      updateCoords(data.lng, data.lat);
      if (showMap && mapRef.current && markerRef.current) {
        markerRef.current.setPosition([data.lng, data.lat]);
        mapRef.current.setCenter([data.lng, data.lat]);
      }
    } catch {
      setErr("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          placeholder="输入详细地址，如：厦门市思明区厦禾路 123 号"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleGeocode}
          disabled={loading}
          className="shrink-0 rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
        >
          {loading ? "定位中…" : "定位"}
        </button>
      </div>

      {coords ? (
        <p className="text-xs text-green-600">
          ✓ 已定位：{coords.lng.toFixed(6)}, {coords.lat.toFixed(6)}
        </p>
      ) : (
        <p className="text-xs text-gray-400">未定位（保存后仍可在地图上拖拽微调）</p>
      )}

      {err && <p className="text-xs text-red-500">{err}</p>}

      {configured ? (
        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          className="text-xs text-rose-600 hover:underline"
        >
          {showMap ? "收起地图" : "在地图上拖拽微调位置"}
        </button>
      ) : (
        <p className="text-xs text-gray-400">
          提示：配置 NEXT_PUBLIC_AMAP_JS_KEY 后将显示可拖拽地图。仅填地址也能通过「定位」自动解析坐标。
        </p>
      )}

      {showMap && configured && (
        <div
          ref={containerRef}
          className="h-56 w-full rounded-lg border border-gray-200"
        />
      )}
    </div>
  );
}
