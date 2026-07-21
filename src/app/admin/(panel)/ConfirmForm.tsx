"use client";

import type { FormEvent } from "react";

// 服务端操作（如 deleteQuestion.bind(null, id)）可作为 prop 传入客户端组件，
// 由客户端组件承载 confirm 交互，避免 Server Component 直接传递事件处理器。
export default function ConfirmForm({
  action,
  confirmText,
  buttonText,
  className,
  buttonClassName,
}: {
  action: (formData: FormData) => void | Promise<void>;
  confirmText: string;
  buttonText: string;
  className?: string;
  buttonClassName?: string;
}) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (!window.confirm(confirmText)) {
      e.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit} className={className}>
      <button type="submit" className={buttonClassName}>
        {buttonText}
      </button>
    </form>
  );
}
