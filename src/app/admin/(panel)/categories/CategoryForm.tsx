"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategory, updateCategory } from "../actions";

type CatOption = { id: string; name: string };
type Existing = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  icon: string | null;
} | null;

export default function CategoryForm({
  categories,
  existing = null,
}: {
  categories: CatOption[];
  existing?: Existing;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (existing) {
          await updateCategory(existing.id, formData);
        } else {
          await createCategory(formData);
        }
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存失败");
      }
    });
  }

  const parentOptions = categories.filter((c) => c.id !== existing?.id);

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
        {existing ? "编辑" : "添加分类"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold text-gray-800">
              {existing ? "编辑分类" : "添加分类"}
            </h3>
            {error && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}
            <form action={submit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-gray-600">名称 *</label>
                <input name="name" required defaultValue={existing?.name || ""} className="input-field w-full" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">Slug</label>
                <input
                  name="slug"
                  defaultValue={existing?.slug || ""}
                  placeholder="留空自动生成"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">父级分类</label>
                <select name="parentId" defaultValue={existing?.parentId || ""} className="input-field w-full">
                  <option value="">无（顶级分类）</option>
                  {parentOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">图标 (emoji 或图片 URL)</label>
                <input name="icon" defaultValue={existing?.icon || ""} className="input-field w-full" />
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
