"use client";

import type { ReactNode } from "react";

/** server component 表单内的确认提交按钮：window.confirm 拦截不可逆操作。 */
export function ConfirmSubmit({
  message,
  className,
  children,
}: {
  message: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
