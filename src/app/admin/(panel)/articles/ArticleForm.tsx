"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createArticle, updateArticle } from "../actions";
import ImageUpload from "../_components/ImageUpload";
import MarkdownEditor from "../_components/MarkdownEditor";

type Existing = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  cover: string | null;
  category: string | null;
  tags: string | null;
  published: boolean;
} | null;

export default function ArticleForm({ existing = null }: { existing?: Existing }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (existing) {
          await updateArticle(existing.id, formData);
        } else {
          await createArticle(formData);
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
        {existing ? "编辑" : "写文章"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 overflow-y-auto"
          onClick={() => setOpen(false)}
        >
          <div
            className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold text-gray-800">
              {existing ? "编辑文章" : "写文章"}
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
                  <label className="mb-1 block text-sm text-gray-600">Slug</label>
                  <input
                    name="slug"
                    defaultValue={existing?.slug || ""}
                    placeholder="留空自动生成"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600">分类</label>
                  <input
                    name="category"
                    defaultValue={existing?.category || ""}
                    placeholder="如：行业资讯"
                    className="input-field w-full"
                  />
                </div>
              </div>
              <ImageUpload
                name="cover"
                defaultValue={existing?.cover}
                label="封面图"
                ratio={16 / 9}
                hint="文章封面建议 16:9（如 1200×675），避免比例失调影响展示"
              />
              <div>
                <label className="mb-1 block text-sm text-gray-600">摘要</label>
                <textarea
                  name="summary"
                  rows={2}
                  defaultValue={existing?.summary || ""}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">正文（支持 Markdown）</label>
                <MarkdownEditor defaultValue={existing?.content || ""} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">标签（逗号分隔）</label>
                <input name="tags" defaultValue={existing?.tags || ""} className="input-field w-full" />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked={existing ? existing.published : false}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-600">立即发布</span>
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
