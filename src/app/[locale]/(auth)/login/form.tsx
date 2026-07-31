"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { LoginState } from "@/lib/auth/actions";

interface LoginFormProps {
  action: (prev: LoginState | undefined, formData: FormData) => Promise<LoginState>;
  fromPath: string;
  locale: string;
}

export function LoginForm({ action, fromPath, locale }: LoginFormProps) {
  const [state, formAction] = useFormState<LoginState | undefined, FormData>(action, undefined);

  useEffect(() => {
    if (state?.redirect) {
      window.location.href = state.redirect;
    }
  }, [state?.redirect]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-3 h-3 rotate-45 bg-[var(--color-accent)] mx-auto" />
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ATELIER
          </h1>
          <p
            className="text-xs uppercase tracking-[0.3em] text-[var(--color-ink-mute)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Admin Sign In
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="from" value={fromPath} />
          <input type="hidden" name="locale" value={locale} />

          <Field id="email" label="Email" type="email" autoComplete="email" />
          <Field id="password" label="Password" type="password" autoComplete="current-password" />

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
      </div>
    </main>
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
      {pending ? "Signing in…" : "Sign In"}
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
