"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { ChangePasswordState } from "@/lib/auth/actions";

interface ChangePasswordFormProps {
  action: (
    prev: ChangePasswordState | undefined,
    formData: FormData,
  ) => Promise<ChangePasswordState>;
  locale: string;
}

const ERROR_KEYS: Record<string, string> = {
  UNAUTHORIZED: "required",
  MISMATCH: "change_password_mismatch",
  TOO_SHORT: "change_password_too_short",
  TOO_LONG: "change_password_too_long",
  NO_PASSWORD: "change_password_no_password",
  CURRENT_WRONG: "change_password_current_wrong",
};

export function ChangePasswordForm({ action, locale }: ChangePasswordFormProps) {
  const t = useTranslations("auth");
  const [state, formAction] = useFormState<ChangePasswordState | undefined, FormData>(
    action,
    undefined,
  );

  useEffect(() => {
    if (state?.ok) {
      window.location.href = `/${locale}/admin`;
    }
  }, [state?.ok, locale]);

  return (
    <form action={formAction} className="space-y-4">
      <Field
        id="current"
        label={t("change_password_current")}
        type="password"
        autoComplete="current-password"
      />
      <Field
        id="new"
        label={t("change_password_new")}
        type="password"
        autoComplete="new-password"
      />
      <Field
        id="confirm"
        label={t("change_password_confirm")}
        type="password"
        autoComplete="new-password"
      />

      {state?.error && (
        <p
          className="text-sm text-[var(--color-danger)]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {t(ERROR_KEYS[state.error] ?? "change_password_mismatch")}
        </p>
      )}

      <SubmitButton label={t("change_password_title")} />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  const t = useTranslations("common");
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-[var(--color-accent)] text-[var(--color-bg)] py-2.5 uppercase tracking-widest text-xs font-medium hover:bg-[var(--color-ink)] transition-colors disabled:opacity-50"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {pending ? t("label.loading") : label}
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
