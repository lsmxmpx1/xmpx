"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";

interface CourseData {
  id: string;
  title: string;
  price: string | null;
  originalPrice: string | null;
  description: string | null;
  tags: string | null;
  cover: string | null;
  categoryId: string;
  status: string;
}

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parentName: string;
}

interface CourseFormProps {
  mode: "create" | "edit";
  initialData?: CourseData | null;
  categories: CategoryData[];
  institutionId: string;
}

export default function CourseForm({ mode, initialData, categories, institutionId: _institutionId }: CourseFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || categories[0]?.id || "");
  const [price, setPrice] = useState(initialData?.price || "");
  const [originalPrice, setOriginalPrice] = useState(initialData?.originalPrice || "");
  const [desc, setDesc] = useState(initialData?.description || "");
  const [tags, setTags] = useState(initialData?.tags || "");
  const [cover, setCover] = useState(initialData?.cover || "");
  const [status, setStatus] = useState(initialData?.status || "ACTIVE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim() || title.trim().length < 2) {
      setError("课程标题至少2个字符");
      return;
    }
    if (!categoryId) {
      setError("请选择课程分类");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        categoryId,
        price: price.trim() || null,
        originalPrice: originalPrice.trim() || null,
        description: desc.trim() || null,
        tags: tags.trim() || null,
        cover: cover.trim() || null,
        status,
      };

      const url = mode === "create"
        ? "/api/courses"
        : `/api/courses/${initialData!.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "操作失败");
      }
    } catch {
      setError("网络错误，请稍后再试");
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (mode !== "edit" || !initialData) return;
    if (!confirm(`确定要删除课程「${initialData.title}」吗？此操作不可撤销。`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${initialData.id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "删除失败");
      }
    } catch {
      setError("网络错误");
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">
          {mode === "create" ? "发布新课程" : "编辑课程"}
        </h2>
        {mode === "edit" && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-sm text-red-500 hover:text-red-600 hover:underline disabled:opacity-50"
          >
            删除课程
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            课程标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            required
            minLength={2}
            maxLength={100}
            placeholder="如：小学三年级数学思维训练班"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              课程分类 <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input-field"
              required
            >
              {Object.entries(
                categories.reduce<Record<string, CategoryData[]>>((acc, cat) => {
                  const key = cat.parentName || "其他";
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(cat);
                  return acc;
                }, {})
              ).map(([parentName, subs]) => (
                <optgroup key={parentName} label={parentName}>
                  {subs.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">课程状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-field"
            >
              <option value="ACTIVE">上架</option>
              <option value="INACTIVE">下架</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">课程价格（元）</label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input-field"
              placeholder="如：3800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">原价（元）</label>
            <input
              type="text"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              className="input-field"
              placeholder="如：5200"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">课程标签</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="input-field"
            placeholder="如：热门推荐、小班教学、名师授课"
          />
          <p className="text-xs text-gray-400 mt-1">多个标签用中文逗号分隔</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">课程封面图</label>
          <ImageUpload
            value={cover}
            onChange={setCover}
            uploadEndpoint="/api/upload"
            label="上传封面图"
            maxSizeMB={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">课程描述</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="input-field"
            rows={4}
            maxLength={1000}
            placeholder="详细介绍课程内容、适合人群、教学目标等"
          />
          <div className="text-right text-xs text-gray-400 mt-1">{desc.length}/1000</div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="btn-secondary flex-1 py-3"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 py-3 disabled:opacity-50"
          >
            {loading ? "提交中..." : mode === "create" ? "发布课程" : "保存修改"}
          </button>
        </div>
      </form>
    </div>
  );
}
