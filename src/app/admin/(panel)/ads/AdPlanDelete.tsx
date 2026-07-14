"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAdPlan } from "../actions";

export default function AdPlanDelete({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onDelete() {
    if (!confirm("确定删除该套餐？此操作不可恢复。")) return;
    startTransition(async () => {
      try {
        await deleteAdPlan(id);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "删除失败");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? "删除中..." : "删除"}
    </button>
  );
}
