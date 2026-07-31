import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

export const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] font-medium",
  {
    variants: {
      variant: {
        neutral: "border-[var(--color-line)] text-[var(--color-ink-mute)] bg-transparent",
        active: "border-[var(--color-accent-2)] text-[var(--color-accent-2)] bg-transparent",
        warn: "border-[var(--color-accent)] text-[var(--color-accent)] bg-transparent",
        danger: "border-[var(--color-danger)] text-[var(--color-danger)] bg-transparent",
        archived: "border-[var(--color-ink-soft)] text-[var(--color-ink-soft)] bg-transparent",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  dot?: boolean;
}

export function StatusBadge({ className, variant, dot, children, ...props }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "inline-block h-1 w-1 rounded-full",
            variant === "active" && "bg-[var(--color-accent-2)]",
            variant === "warn" && "bg-[var(--color-accent)]",
            variant === "danger" && "bg-[var(--color-danger)]",
            variant === "archived" && "bg-[var(--color-ink-soft)]",
            variant === "neutral" && "bg-[var(--color-ink-mute)]",
          )}
        />
      )}
      {children}
    </span>
  );
}
