"use client";

import { useEffect, useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import AMapPicker from "@/components/map/AMapPicker";

export interface CampusItem {
  id?: string;
  name: string;
  district: string;
  address: string;
  phone: string;
  images: string;
  lng: number | null;
  lat: number | null;
  isMain: boolean;
  sortOrder: number;
  // 前端临时标记（新增未保存时本地 key），便于保存后替换为服务端 id
  _key?: string;
}

const DISTRICTS = ["思明区", "湖里区", "集美区", "海沧区", "同安区", "翔安区"];

function emptyCampus(sortOrder: number): CampusItem {
  return {
    name: "",
    district: "思明区",
    address: "",
    phone: "",
    images: "",
    lng: null,
    lat: null,
    isMain: false,
    sortOrder,
    _key: `new-${Date.now()}-${sortOrder}`,
  };
}

export default function CampusManager() {
  const [campuses, setCampuses] = useState<CampusItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/institutions/campuses")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.campuses)) {
          setCampuses(
            d.campuses.map((c: CampusItem) => ({
              ...c,
              lng: c.lng ?? null,
              lat: c.lat ?? null,
              images: c.images ?? "",
            }))
          );
        }
      })
      .catch(() => setError("加载校区失败"))
      .finally(() => setLoaded(true));
  }, []);

  const updateField = (key: string, field: keyof CampusItem, value: unknown) => {
    setCampuses((prev) =>
      prev.map((c) => (c.id === key || c._key === key ? { ...c, [field]: value } : c))
    );
  };

  const addCampus = () => {
    setCampuses((prev) => [...prev, emptyCampus(prev.length)]);
  };

  const removeCampus = async (key: string) => {
    const target = campuses.find((c) => (c.id ?? c._key) === key);
    if (target?.id) {
      const res = await fetch(`/api/institutions/campuses/${target.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError("删除失败");
        return;
      }
    }
    setCampuses((prev) => prev.filter((c) => (c.id ?? c._key) !== key));
  };

  const setMain = (key: string) => {
    setCampuses((prev) =>
      prev.map((c) => {
        const isThis = (c.id ?? c._key) === key;
        return { ...c, isMain: isThis ? !c.isMain : c.isMain };
      })
    );
  };

  const saveCampus = async (key: string) => {
    const target = campuses.find((c) => (c.id ?? c._key) === key);
    if (!target) return;
    if (!target.name.trim()) {
      setError("请填写校区名称");
      return;
    }
    setSavingKey(key);
    setError("");
    try {
      const payload = {
        name: target.name,
        district: target.district,
        address: target.address,
        phone: target.phone,
        images: target.images,
        lng: target.lng,
        lat: target.lat,
        isMain: target.isMain,
        sortOrder: target.sortOrder,
      };
      const res = target.id
        ? await fetch(`/api/institutions/campuses/${target.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/institutions/campuses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "保存失败");
        return;
      }
      const saved = data.campus;
      setCampuses((prev) =>
        prev.map((c) =>
          (c.id ?? c._key) === key
            ? { ...c, id: saved.id, lng: saved.lng, lat: saved.lat }
            : c
        )
      );
    } catch {
      setError("网络错误，请稍后再试");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">校区管理</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            一个机构可设置多个校区，每个校区独立配置地址、电话与图片，并在地图上展示。
          </p>
        </div>
        <button
          type="button"
          onClick={addCampus}
          className="shrink-0 rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          + 新增校区
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm mb-4">{error}</div>
      )}

      {loaded && campuses.length === 0 && (
        <div className="text-sm text-gray-400 py-6 text-center border border-dashed border-gray-200 rounded-lg">
          暂无校区，点击「新增校区」添加（至少添加一个主校区便于学员到店）。
        </div>
      )}

      <div className="space-y-5">
        {campuses.map((c) => {
          const key = c.id ?? c._key!;
          const saving = savingKey === key;
          return (
            <div key={key} className="border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">校区 #{c.sortOrder + 1}</span>
                  <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={c.isMain}
                      onChange={() => setMain(key)}
                      className="accent-rose-600"
                    />
                    设为主校区
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => removeCampus(key)}
                  className="text-sm text-red-500 hover:underline"
                >
                  删除
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    校区名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => updateField(key, "name", e.target.value)}
                    className="input-field"
                    placeholder="如：思明校区"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">所在区域</label>
                  <select
                    value={c.district}
                    onChange={(e) => updateField(key, "district", e.target.value)}
                    className="input-field"
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">校区地址</label>
                <AMapPicker
                  address={c.address}
                  lng={c.lng}
                  lat={c.lat}
                  district={c.district}
                  onLocated={(d) => {
                    updateField(key, "address", d.address);
                    updateField(key, "lng", d.lng);
                    updateField(key, "lat", d.lat);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">校区电话</label>
                <input
                  type="text"
                  value={c.phone}
                  onChange={(e) => updateField(key, "phone", e.target.value)}
                  className="input-field"
                  placeholder="0592-XXXXXXXX"
                />
              </div>

              <ImageUpload
                label="校区图片（最多6张）"
                value={c.images}
                onChange={(v) => updateField(key, "images", v)}
                multiple
                maxImages={6}
                aspectRatio="video"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => saveCampus(key)}
                  disabled={saving}
                  className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  {saving ? "保存中…" : c.id ? "保存修改" : "添加校区"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
