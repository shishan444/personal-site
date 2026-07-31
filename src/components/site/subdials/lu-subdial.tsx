"use client";

import { useEffect, useState } from "react";

export interface LuSubdialProps {
  index: number;
  total: number;
  chapterId: string;
  chapterName: string;
  visible: boolean;
}

export function LuSubdial({ index, total, chapterName, visible }: LuSubdialProps) {
  const [flipKey, setFlipKey] = useState(0);
  useEffect(() => {
    setFlipKey((k) => k + 1);
  }, [index, chapterName]);

  return (
    <div className="flex flex-col gap-2 select-none">
      <div
        className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink-soft)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        CH.
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          key={flipKey}
          className="text-2xl font-semibold text-[var(--color-accent)]"
          style={{ fontFamily: "var(--font-display)", animation: "tick-flip 320ms ease-out" }}
        >
          {String(index).padStart(2, "0")}
        </span>
        <span
          className="text-xs text-[var(--color-ink-soft)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          / {String(total).padStart(2, "0")}
        </span>
      </div>
      <div
        className={`text-[10px] uppercase tracking-[0.2em] ${
          visible ? "text-[var(--color-ink-mute)]" : "text-[var(--color-ink-soft)]"
        }`}
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {chapterName}
      </div>
    </div>
  );
}
