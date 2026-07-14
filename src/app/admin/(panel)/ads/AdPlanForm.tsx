"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAdPlan, updateAdPlan } from "../actions";

type Existing = {
  id: string;
  name: string;
  level: string;
  price: number;
  duration: number;
  features: string;
  description: string | null;
  active: boolean;
  sortOrder: number;
} | null;

export default function AdPlanForm({ existing = null }: { existing?: Existing }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (existing) {
          await updateAdPlan(existing.id, formData);
        } else {
          await createAdPlan(formData);
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
        {existing ? "编辑" : "添加套餐"}
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
              {existing ? "编辑套餐" : "添加套餐"}
            </h3>
            {error && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}
            <form action={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-600">套餐名称 *</label>
                  <input name="name" required defaultValue={existing?.name || ""} className="input-field w-full" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600">等级标识 level *</label>
                  <input
                    name="level"
                    required
                    defaultValue={existing?.level || ""}
                    placeholder="如：VIP / GOLD / SILVER"
                    className="input-field w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-600">价格(¥)</label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    min="0"
                    defaultValue={existing?.price ?? 0}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600">时长(天)</label>
                  <input
                    type="number"
                    name="duration"
                    min="0"
                    defaultValue={existing?.duration ?? 0}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600">排序</label>
                  <input
                    type="number"
                    name="sortOrder"
                    defaultValue={existing?.sortOrder ?? 0}
                    className="input-field w-full"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">功能特性（每行一条或逗号分隔）</label>
                <textarea
                  name="features"
                  rows={3}
                  defaultValue={existing?.features || ""}
                  placeholder="如：首页推荐位,专属客服,数据报表"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">套餐说明</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={existing?.description || ""}
                  className="input-field w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={existing ? existing.active : true}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-600">启用</span>
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
