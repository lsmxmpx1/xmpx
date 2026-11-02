"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSchoolDirectoryAdmin } from "./actions";

export default function SchoolForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createSchoolDirectoryAdmin(formData);
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
            <h3 className="mb-1 text-lg font-bold text-gray-800">新增机构（系统录入）</h3>
            <p className="mb-4 text-xs text-gray-400">
              标识(id)由系统自动生成；填写「学校地址」保存后将自动在地图标注。
            </p>
            {error && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}
            <form action={submit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-gray-600">学校名称 *</label>
                <input name="name" required className="input-field w-full" placeholder="如：厦门市XX职业培训学校" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">主管部门</label>
                <input name="authority" className="input-field w-full" placeholder="如：厦门市教育局 / 人社局" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">办学内容</label>
                <textarea name="educationalContent" rows={2} className="input-field w-full" placeholder="如：职业技能培训、学历教育、艺术培训等" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-600">办学许可证编号</label>
                  <input name="licenseNo" className="input-field w-full" placeholder="如：教民135020372000XXX号" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600">举办者</label>
                  <input name="organizer" className="input-field w-full" placeholder="举办单位或个人名称" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">学校地址</label>
                <input name="address" className="input-field w-full" placeholder="如：厦门市思明区XX路XX号（保存后自动地图标注）" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-600">法定代表人</label>
                  <input name="legalPerson" className="input-field w-full" placeholder="法人姓名" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600">联系方式</label>
                  <input name="contact" className="input-field w-full" placeholder="电话 / 邮箱" />
                </div>
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
