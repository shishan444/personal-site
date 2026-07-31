"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, required, className, id, ...props }, ref) => {
    const generatedId = React.useId();
    const fieldId = id ?? generatedId;
    return (
      <div className="space-y-1.5">
        <label
          htmlFor={fieldId}
          className="block text-xs uppercase tracking-widest text-[var(--color-ink-soft)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {label}
          {required && <span className="text-[var(--color-accent)]">*</span>}
        </label>
        <input
          ref={ref}
          id={fieldId}
          required={required}
          className={cn(
            "w-full bg-transparent border px-3 py-2 text-[var(--color-ink)] outline-none transition-colors",
            error
              ? "border-[var(--color-danger)]"
              : "border-[var(--color-line)] focus:border-[var(--color-accent)]",
            className,
          )}
          {...props}
        />
        {hint && !error && (
          <p
            className="text-[10px] text-[var(--color-ink-soft)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {hint}
          </p>
        )}
        {error && (
          <p
            className="text-xs text-[var(--color-danger)]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);
FormField.displayName = "FormField";

export interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string | null;
  hint?: string;
}

export const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const generatedId = React.useId();
    const fieldId = id ?? generatedId;
    return (
      <div className="space-y-1.5">
        <label
          htmlFor={fieldId}
          className="block text-xs uppercase tracking-widest text-[var(--color-ink-soft)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {label}
        </label>
        <textarea
          ref={ref}
          id={fieldId}
          className={cn(
            "w-full bg-transparent border px-3 py-2 text-[var(--color-ink)] outline-none transition-colors min-h-[100px]",
            error
              ? "border-[var(--color-danger)]"
              : "border-[var(--color-line)] focus:border-[var(--color-accent)]",
            className,
          )}
          {...props}
        />
        {hint && !error && (
          <p
            className="text-[10px] text-[var(--color-ink-soft)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {hint}
          </p>
        )}
        {error && (
          <p
            className="text-xs text-[var(--color-danger)]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);
TextareaField.displayName = "TextareaField";
