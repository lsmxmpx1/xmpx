"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAd, updateAd } from "../actions";
import ImageUpload from "../_components/ImageUpload";

type InstOption = { id: string; name: string };
type Existing = {
  id: string;
  title: string;
  position: string;
  institutionId: string | null;
  image: string | null;
  link: string | null;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
} | null;

const POSITIONS = [
  { value: "HOME_TOP", label: "首页顶部" },
  { value: "HOME_SIDEBAR", label: "首页侧栏" },
  { value: "COURSE_LIST", label: "课程列表页" },
  { value: "INSTITUTION_LIST", label: "机构列表页" },
  { value: "ARTICLE_LIST", label: "资讯列表页" },
];

export default function AdForm({
  institutions,
  existing = null,
}: {
  institutions: InstOption[];
  existing?: Existing;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<string>(existing?.position || "HOME_TOP");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (existing) {
          await updateAd(existing.id, formData);
        } else {
          await createAd(formData);
        }
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存失败");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          existing
            ? "px-3 py-1 text-xs border rounded-lg hover:bg-gray-100"
            : "px-4 py-2 bg-slate-900 text-white rounded-lg text-sm"
        }
      >
        {existing ? "编辑" : "添加广告"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 overflow-y-auto"
          onClick={() => setOpen(false)}
        >
          <div
            className="my-8 w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold text-gray-800">
              {existing ? "编辑广告" : "添加广告"}
            </h3>
            {error && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}
            <form action={submit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-gray-600">标题 *</label>
                <input name="title" required defaultValue={existing?.title || ""} className="input-field w-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-600">位置</label>
                  <select
                    name="position"
                    value={pos}
                    onChange={(e) => setPos(e.target.value)}
                    className="input-field w-full"
                  >
                    {POSITIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600">所属机构</label>
                  <select
                    name="institutionId"
                    defaultValue={existing?.institutionId || ""}
                    className="input-field w-full"
                  >
                    <option value="">平台（无机构）</option>
                    {institutions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <ImageUpload name="image" defaultValue={existing?.image} label="广告图片" position={pos} />
              <div>
                <label className="mb-1 block text-sm text-gray-600">跳转链接</label>
                <input name="link" defaultValue={existing?.link || ""} placeholder="https://" className="input-field w-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-600">开始日期</label>
                  <input type="date" name="startDate" defaultValue={existing?.startDate || ""} className="input-field w-full" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600">结束日期</label>
                  <input type="date" name="endDate" defaultValue={existing?.endDate || ""} className="input-field w-full" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={existing ? existing.active : true}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-600">启用展示</span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:underline"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  {pending ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
