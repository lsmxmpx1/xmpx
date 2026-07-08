"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";

interface InstitutionData {
  id: string;
  name: string;
  district: string;
  address: string | null;
  phone: string | null;
  description: string | null;
  website: string | null;
  logo: string | null;
  cover: string | null;
  images: string | null;
  status: string;
}

interface InstitutionFormProps {
  mode: "create" | "edit";
  initialData?: InstitutionData | null;
}

const DISTRICTS = ["思明区", "湖里区", "集美区", "海沧区", "同安区", "翔安区"];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "审核中", color: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "已通过", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "已拒绝", color: "bg-red-100 text-red-700" },
};

export default function InstitutionForm({ mode, initialData }: InstitutionFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name || "");
  const [district, setDistrict] = useState(initialData?.district || "思明区");
  const [address, setAddress] = useState(initialData?.address || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [desc, setDesc] = useState(initialData?.description || "");
  const [website, setWebsite] = useState(initialData?.website || "");
  const [logo, setLogo] = useState(initialData?.logo || "");
  const [cover, setCover] = useState(initialData?.cover || "");
  const [images, setImages] = useState(initialData?.images || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        name,
        district,
        address,
        phone,
        description: desc,
        website,
        logo,
        cover,
        images,
      };
      const res = await fetch("/api/institutions", {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (mode === "create") {
          setSuccess(true);
        } else {
          router.refresh();
        }
      } else {
        const data = await res.json();
        setError(data.error || "操作失败");
      }
    } catch {
      setError("网络错误，请稍后再试");
    }
    setLoading(false);
  }

  // Success screen for create mode
  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-2">入驻申请提交成功！</h1>
          <p className="text-gray-500 mb-6">
            您的机构信息已提交，平台将在 1-3 个工作日内完成审核。
            <br />
            审核通过后，您就可以发布课程、接收学员咨询了。
          </p>
          <div className="bg-purple-50 rounded-lg p-4 mb-6 text-left text-sm text-gray-600">
            <p className="font-medium text-purple-700 mb-1">📝 接下来您可以：</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>在「机构设置」中完善机构信息</li>
              <li>审核通过后，在「课程管理」中发布课程</li>
              <li>在「咨询线索」中查看学员咨询</li>
            </ul>
          </div>
          <button
            onClick={() => router.push("/dashboard/institution")}
            className="btn-primary w-full py-3"
          >
            进入机构管理
          </button>
        </div>
      </div>
    );
  }

  const isReadOnly = mode === "edit" && initialData?.status === "PENDING";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">
        {mode === "create" ? "入驻厦门培训网" : "编辑机构信息"}
      </h1>
      <p className="text-gray-500 mb-6">
        {mode === "create"
          ? "填写以下信息，提交后将由平台审核"
          : "修改机构信息，保存后即时生效"}
      </p>

      {mode === "edit" && initialData && (
        <div className="mb-6 flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
          <span className="text-sm text-gray-500">当前状态：</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_MAP[initialData.status]?.color || "bg-gray-100 text-gray-600"}`}>
            {STATUS_MAP[initialData.status]?.label || initialData.status}
          </span>
          {initialData.status === "PENDING" && (
            <span className="text-sm text-gray-400">（审核中信息不可修改）</span>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            机构名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            required
            minLength={2}
            maxLength={50}
            placeholder="请输入机构全称"
            disabled={isReadOnly}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              所在区域 <span className="text-red-500">*</span>
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="input-field"
              disabled={isReadOnly}
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field"
              placeholder="0592-XXXXXXXX"
              disabled={isReadOnly}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">详细地址</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input-field"
            placeholder="如：厦门市思明区XX路XX号"
            disabled={isReadOnly}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">官方网站</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="input-field"
            placeholder="https://www.example.com"
            disabled={isReadOnly}
          />
        </div>

        {/* Logo upload */}
        <ImageUpload
          label="机构 Logo"
          value={logo}
          onChange={setLogo}
          aspectRatio="square"
          disabled={isReadOnly}
        />

        {/* Cover upload */}
        <ImageUpload
          label="封面图片"
          value={cover}
          onChange={setCover}
          aspectRatio="wide"
          disabled={isReadOnly}
        />

        {/* Store images (multiple) */}
        <ImageUpload
          label="门店图片（最多6张）"
          value={images}
          onChange={setImages}
          multiple
          maxImages={6}
          aspectRatio="video"
          disabled={isReadOnly}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">机构简介</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="input-field"
            rows={4}
            maxLength={500}
            placeholder="介绍您的机构特色、师资力量、教学理念等（最多500字）"
            disabled={isReadOnly}
          />
          <div className="text-right text-xs text-gray-400 mt-1">{desc.length}/500</div>
        </div>

        <div className="flex gap-3 pt-2">
          {mode === "edit" && (
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary flex-1 py-3"
            >
              返回
            </button>
          )}
          <button
            type="submit"
            disabled={loading || isReadOnly}
            className="btn-primary flex-1 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "提交中..." : mode === "create" ? "提交入驻申请" : "保存修改"}
          </button>
        </div>

        {isReadOnly && (
          <p className="text-sm text-gray-400 text-center">
            机构正在审核中，信息暂时不可修改
          </p>
        )}
      </form>
    </div>
  );
}
