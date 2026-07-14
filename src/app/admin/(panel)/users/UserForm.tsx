"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUser, updateUser } from "../actions";

type Existing = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
} | null;

export default function UserForm({ existing = null }: { existing?: Existing }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (existing) {
          await updateUser(existing.id, formData);
        } else {
          await createUser(formData);
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
        {existing ? "编辑" : "添加用户"}
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
              {existing ? "编辑用户" : "添加用户"}
            </h3>
            {error && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}
            <form action={submit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-gray-600">昵称</label>
                <input name="name" defaultValue={existing?.name || ""} className="input-field w-full" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">邮箱</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={existing?.email || ""}
                  placeholder="用于登录，需唯一"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">手机</label>
                <input
                  name="phone"
                  defaultValue={existing?.phone || ""}
                  placeholder="用于登录，需唯一"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">角色</label>
                <select name="role" defaultValue={existing?.role || "USER"} className="input-field w-full">
                  <option value="USER">普通用户 (USER)</option>
                  <option value="ADMIN">管理员 (ADMIN)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">
                  密码 {existing ? "（留空则不修改）" : "（必填）"}
                </label>
                <input
                  name="password"
                  type="password"
                  required={!existing}
                  placeholder={existing ? "不修改请留空" : "请设置登录密码"}
                  className="input-field w-full"
                />
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
