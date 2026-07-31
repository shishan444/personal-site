"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();
  useEffect(() => {
    console.error("[500]", error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-8 text-center">
      <div
        className="text-[clamp(120px,30vw,300px)] font-bold leading-[0.85] select-none"
        style={{ fontFamily: "var(--font-display)", color: "rgba(185,28,28,0.08)" }}
      >
        500
      </div>
      <div
        className="text-[10px] uppercase tracking-[0.3em]"
        style={{ fontFamily: "var(--font-mono)", color: "var(--color-danger)" }}
      >
        SERVICE DEGRADED
      </div>
      <h1
        className="text-4xl md:text-6xl font-bold leading-tight tracking-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {t("error.500_title")}
      </h1>
      <p
        className="text-sm text-[var(--color-ink-mute)] max-w-md"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {t("error.500_desc")}
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-[var(--color-accent)] text-[var(--color-bg)] px-6 py-3 uppercase tracking-widest text-xs hover:bg-[var(--color-ink)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        ↻ {t("error.500_retry")}
      </button>
    </main>
  );
}
