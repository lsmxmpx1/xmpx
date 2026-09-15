"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInstitutionAdmin } from "../actions";

const DISTRICTS = ["思明区", "湖里区", "集美区", "海沧区", "同安区", "翔安区"];

export default function InstitutionForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createInstitutionAdmin(formData);
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
        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm"
      >
        新增机构
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
            <h3 className="mb-4 text-lg font-bold text-gray-800">新增机构</h3>
            {error && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}
            <form action={submit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-gray-600">机构名称 *</label>
                <input name="name" required className="input-field w-full" placeholder="请输入机构全称" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-600">所在区域 *</label>
                  <select name="district" defaultValue="思明区" className="input-field w-full">
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600">联系电话</label>
                  <input name="phone" className="input-field w-full" placeholder="0592-XXXXXXXX" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">详细地址</label>
                <input name="address" className="input-field w-full" placeholder="如：厦门市思明区XX路XX号" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">官方网站</label>
                <input name="website" className="input-field w-full" placeholder="https://www.example.com" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">办学内容</label>
                <textarea name="educationalContent" rows={2} className="input-field w-full" placeholder="如：中小学学科辅导、艺术培训、职业资格培训等" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-600">办学许可证编号</label>
                  <input name="licenseNo" className="input-field w-full" placeholder="如：教民135020372000XXX号" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600">举办者</label>
                  <input name="organizer" className="input-field w-full" placeholder="机构举办者/法人名称" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">机构简介</label>
                <textarea name="description" rows={3} className="input-field w-full" placeholder="机构特色、师资力量、教学理念等" />
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
