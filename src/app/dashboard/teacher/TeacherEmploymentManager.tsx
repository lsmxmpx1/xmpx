"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEmployment, deleteEmployment } from "./actions";

interface InstitutionOption {
  id: string;
  name: string;
}

interface Employment {
  id: string;
  institutionId: string;
  institutionName: string;
  title: string | null;
  startDate: string;
  endDate: string | null;
}

function fmt(d: string | null) {
  if (!d) return "至今";
  return new Date(d).toLocaleDateString("zh-CN", { year: "numeric", month: "short" });
}

export default function TeacherEmploymentManager({
  institutions,
  employments,
}: {
  institutions: InstitutionOption[];
  employments: Employment[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const res = await createEmployment(fd);
    setSubmitting(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    (e.target as HTMLFormElement).reset();
    setAdding(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除这条任职记录？")) return;
    const res = await deleteEmployment(id);
    if (res?.error) {
      alert(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {/* 履历时间线 */}
      {employments.length === 0 ? (
        <p className="text-sm text-gray-400 mb-4">暂无任职记录，添加你的从业经历吧</p>
      ) : (
        <ul className="space-y-3 mb-4">
          {employments.map((emp) => (
            <li
              key={emp.id}
              className="flex items-start justify-between gap-3 border border-gray-100 rounded-lg p-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0" />
                <div>
                  <div className="font-medium text-gray-800">
                    {emp.institutionName}
                    {emp.title && <span className="text-gray-500 font-normal"> · {emp.title}</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {fmt(emp.startDate)} — {fmt(emp.endDate)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(emp.id)}
                className="text-xs text-red-500 hover:text-red-600 shrink-0"
              >
                删除
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form onSubmit={handleAdd} className="border border-gray-200 rounded-lg p-4 space-y-3">
          {error && <div className="text-sm text-red-500">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">机构 *</label>
              <select
                name="institutionId"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">选择机构</option>
                {institutions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">职务</label>
              <input
                name="title"
                maxLength={30}
                placeholder="如：教学主管"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">开始时间</label>
              <input
                name="startDate"
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">结束时间（留空=至今）</label>
              <input
                name="endDate"
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-5 text-sm disabled:opacity-50"
            >
              {submitting ? "添加中…" : "保存"}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="btn-secondary px-5 text-sm"
            >
              取消
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 w-full"
        >
          + 添加任职记录
        </button>
      )}
    </div>
  );
}
