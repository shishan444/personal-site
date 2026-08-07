"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useState } from "react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const segments = pathname.split("/");
  const stripped = segments.filter((s, idx) => !(idx === 1 && (s === "zh" || s === "en")));
  const switchTo = (next: string) => {
    const newPath = `/${next}${stripped.slice(1).join("/")}`;
    router.push(newPath);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="border border-[var(--color-line)] glass-chip px-3 py-1.5 text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {locale === "zh" ? "中" : "EN"} ▾
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 mt-1 z-20 glass-panel min-w-[100px]">
            <button
              type="button"
              onClick={() => switchTo("zh")}
              className={`block w-full text-left px-3 py-2 text-xs hover:bg-[var(--color-glass)] ${
                locale === "zh" ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]"
              }`}
              style={{ fontFamily: "var(--font-body)" }}
            >
              中文
            </button>
            <button
              type="button"
              onClick={() => switchTo("en")}
              className={`block w-full text-left px-3 py-2 text-xs hover:bg-[var(--color-glass)] ${
                locale === "en" ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]"
              }`}
              style={{ fontFamily: "var(--font-body)" }}
            >
              English
            </button>
          </div>
        </>
      )}
    </div>
  );
}
