"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { ChangePasswordState } from "@/lib/auth/actions";

interface ChangePasswordFormProps {
  action: (
    prev: ChangePasswordState | undefined,
    formData: FormData,
  ) => Promise<ChangePasswordState>;
}

export function ChangePasswordForm({ action }: ChangePasswordFormProps) {
  const [state, formAction] = useFormState<ChangePasswordState | undefined, FormData>(
    action,
    undefined,
  );

  useEffect(() => {
    if (state?.ok) {
      window.location.href = "/admin";
    }
  }, [state?.ok]);

  return (
    <form action={formAction} className="space-y-4">
      <Field id="current" label="当前密码" type="password" autoComplete="current-password" />
      <Field id="new" label="新密码" type="password" autoComplete="new-password" />
      <Field id="confirm" label="确认新密码" type="password" autoComplete="new-password" />

      {state?.error && (
        <p
          className="text-sm text-[var(--color-danger)]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-[var(--color-accent)] text-[var(--color-bg)] py-2.5 uppercase tracking-widest text-xs font-medium hover:bg-[var(--color-ink)] transition-colors disabled:opacity-50"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {pending ? "Saving…" : "Set New Password"}
    </button>
  );
}

function Field({
  id,
  label,
  type,
  autoComplete,
}: {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs uppercase tracking-widest text-[var(--color-ink-soft)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required
        className="w-full bg-transparent border border-[var(--color-line)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
        style={{ fontFamily: "var(--font-body)" }}
      />
    </div>
  );
}
