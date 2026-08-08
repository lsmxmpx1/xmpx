/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { DISTRICTS } from "@/lib/utils";
import type { MapPoint } from "@/components/map/AMapMap";

// 用 ssr: false 延迟加载地图组件，避免高德 JS API 注入 <script> 导致 hydration mismatch
const AMapMap = dynamic(() => import("@/components/map/AMapMap").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-400" style={{ height: 420 }}>
      地图加载中…
    </div>
  ),
});

interface CampusDTO {
  id: string;
  name: string;
  lng: number | null;
  lat: number | null;
  address: string | null;
  phone: string | null;
  isMain: boolean;
}
interface InstDTO {
  id: string;
  name: string;
  slug: string;
  district: string;
  logo: string | null;
  rating: number;
  reviewCount: number;
  address: string | null;
  campuses: CampusDTO[];
}

// 地球半径（km），用于 haversine 计算两点距离
const R = 6371;
function haversine(
  a: { lng: number; lat: number },
  b: { lng: number; lat: number }
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function nearestKm(inst: InstDTO, loc: { lng: number; lat: number }): number {
  let min = Infinity;
  for (const c of inst.campuses) {
    if (Number.isFinite(c.lng) && Number.isFinite(c.lat)) {
      const d = haversine(loc, { lng: Number(c.lng), lat: Number(c.lat) });
      if (d < min) min = d;
    }
  }
  return min;
}

export default function InstitutionsMapPanel({
  initialDistrict,
}: {
  initialDistrict?: string;
}) {
  const [open, setOpen] = useState(false);
  const [district, setDistrict] = useState(initialDistrict || "");
  const [insts, setInsts] = useState<InstDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lng: number; lat: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 打开面板或切换区域时拉取地图点
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/institutions/campus-points?district=${encodeURIComponent(district)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && Array.isArray(d.institutions)) setInsts(d.institutions);
      })
      .catch(() => setInsts([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, district]);

  const points: MapPoint[] = [];
  insts.forEach((inst) => {
    inst.campuses.forEach((c) => {
      if (Number.isFinite(c.lng) && Number.isFinite(c.lat)) {
        points.push({
          id: c.id,
          lng: Number(c.lng),
          lat: Number(c.lat),
          title: `${inst.name} · ${c.name}`,
          address: c.address || undefined,
          phone: c.phone || undefined,
        });
      }
    });
  });

  // 离我最近排序
  const sortedInsts = userLoc
    ? [...insts].sort((a, b) => nearestKm(a, userLoc) - nearestKm(b, userLoc))
    : insts;

  const handleLocateMe = (loc: { lng: number; lat: number }) => {
    setUserLoc(loc);
  };

  const handleMarkerClick = (p: MapPoint) => {
    const inst = insts.find((i) => i.campuses.some((c) => c.id === p.id));
    if (inst) {
      setSelectedId(inst.id);
      listRefs.current[inst.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full sm:w-auto inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-100"
      >
        {open ? "收起地图" : "🗺️ 在地图上找机构"}
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setSelectedId(null);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">全部区域</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <span className="text-sm text-gray-500">
              {loading ? "加载中…" : `共 ${insts.length} 家机构 · ${points.length} 个校区落点`}
            </span>
          </div>

          {points.length > 0 ? (
            <AMapMap
              points={points}
              height={420}
              showMyLocation
              onLocateMe={handleLocateMe}
              onMarkerClick={handleMarkerClick}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              当前筛选下暂无已标注地图坐标的校区。
              {userLoc && "（已按您的位置排序下方列表）"}
            </div>
          )}

          {userLoc && (
            <p className="text-xs text-gray-500">
              ✓ 已按您的位置由近及远排序（直线距离仅供参考，实际距离以导航为准）
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedInsts.map((inst) => {
              const distLabel = userLoc
                ? (() => {
                    const d = nearestKm(inst, userLoc);
                    return Number.isFinite(d) ? `约 ${d.toFixed(1)} km` : "暂无坐标";
                  })()
                : null;
              return (
                <div
                  key={inst.id}
                  ref={(el) => {
                    listRefs.current[inst.id] = el;
                  }}
                  className={`card p-4 transition-all ${
                    selectedId === inst.id ? "ring-2 ring-rose-400" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {inst.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={inst.logo}
                        alt={inst.name}
                        className="w-12 h-12 rounded-xl object-cover border shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-lg font-bold text-primary-600 shrink-0">
                        {inst.name.slice(0, 2)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/institutions/${inst.id}`}
                        className="font-semibold hover:text-rose-600"
                      >
                        {inst.name}
                      </Link>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {inst.district}
                        {distLabel && <span className="text-rose-500 ml-2">{distLabel}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span className="text-orange-400">★ {inst.rating.toFixed(1)}</span>
                        <span>{inst.reviewCount} 评价</span>
                      </div>
                    </div>
                  </div>
                  {inst.campuses.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {inst.campuses.map((c) => (
                        <div key={c.id} className="text-xs text-gray-500 flex items-center gap-1">
                          <span>{c.isMain ? "🏠" : "📍"}</span>
                          <span className="font-medium text-gray-600">{c.name}</span>
                          {c.address && <span className="truncate">· {c.address}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
