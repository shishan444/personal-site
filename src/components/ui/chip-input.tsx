"use client";

import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface ChipInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  max?: number;
  className?: string;
}

export function ChipInput({ value, onChange, placeholder, max, className }: ChipInputProps) {
  const [draft, setDraft] = React.useState("");

  const commit = () => {
    const v = draft.trim();
    if (!v) return;
    if (max && value.length >= max) return;
    if (value.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...value, v]);
    setDraft("");
  };

  const remove = (chip: string) => {
    onChange(value.filter((c) => c !== chip));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border border-[var(--color-line)] bg-transparent px-2 py-2 focus-within:border-[var(--color-accent)]",
        className,
      )}
    >
      {value.map((chip) => (
        <span
          key={chip}
          className="inline-flex items-center gap-1 bg-[var(--color-bg-3)] border border-[var(--color-line)] px-2 py-0.5 text-xs text-[var(--color-ink)]"
        >
          {chip}
          <button
            type="button"
            onClick={() => remove(chip)}
            className="text-[var(--color-ink-soft)] hover:text-[var(--color-danger)]"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-soft)]"
      />
    </div>
  );
}
