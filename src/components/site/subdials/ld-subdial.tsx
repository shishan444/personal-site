"use client";

export interface LdSubdialProps {
  eyebrow: string;
  title: string;
  desc?: string;
  visible: boolean;
}

export function LdSubdial({ eyebrow, title, desc, visible }: LdSubdialProps) {
  return (
    <div
      className={`max-w-[200px] transition-opacity duration-300 select-none ${
        visible ? "opacity-100" : "opacity-40"
      }`}
    >
      <div
        className="text-[9px] uppercase tracking-[0.25em] text-[var(--color-accent)] mb-1"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {eyebrow}
      </div>
      <div
        className="text-sm font-medium text-[var(--color-ink)] mb-0.5 truncate"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </div>
      {desc && (
        <div
          className="text-[10px] text-[var(--color-ink-mute)] line-clamp-2"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {desc}
        </div>
      )}
    </div>
  );
}
