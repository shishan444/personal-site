import { cn } from "@/lib/utils/cn";

export interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
  className?: string;
}

export function KpiCard({ label, value, hint, accent, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        "border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5 flex flex-col gap-2",
        accent && "border-l-2 border-l-[var(--color-accent)]",
        className,
      )}
    >
      <div
        className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </div>
      <div
        className="text-3xl font-semibold text-[var(--color-ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
      {hint && (
        <div
          className="text-xs text-[var(--color-ink-mute)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
