"use client";

import { useTranslations } from "next-intl";

export interface RuSubdialProps {
  chapterIds: string[];
  activeId: string | null;
  visitedIds: Set<string>;
}

const LABEL_KEY: Record<string, string> = {
  "01": "nav.chapter_hero",
  "02": "nav.chapter_writing",
  "03": "nav.chapter_agents",
  "04": "nav.chapter_timeline",
  "05": "nav.chapter_outro",
};

export function RuSubdial({ chapterIds, activeId, visitedIds }: RuSubdialProps) {
  const t = useTranslations();

  function jump(id: string) {
    if (typeof document === "undefined") return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav aria-label={t("nav.chapter")} className="flex flex-col items-end gap-2.5 select-none">
      {chapterIds.map((id, idx) => {
        const isActive = id === activeId;
        const isVisited = visitedIds.has(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => jump(id)}
            aria-current={isActive ? "true" : undefined}
            className="group flex items-center gap-2.5 cursor-pointer"
          >
            <span
              className={`hidden md:inline text-[11px] uppercase tracking-[0.2em] transition-colors ${
                isActive
                  ? "text-[var(--color-ink)]"
                  : isVisited
                    ? "text-[var(--color-ink-mute)] group-hover:text-[var(--color-ink)]"
                    : "text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink-mute)]"
              }`}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {t(LABEL_KEY[id] ?? "nav.chapter")}
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className={`w-px transition-all duration-300 ${
                  isActive ? "h-5 bg-[var(--color-accent)]" : "h-0 bg-transparent"
                }`}
              />
              <span
                className={`rounded-full transition-all duration-300 ${
                  isActive
                    ? "w-1.5 h-1.5 bg-[var(--color-accent)]"
                    : isVisited
                      ? "w-1 h-1 bg-[var(--color-ink-mute)]"
                      : "w-1 h-1 bg-[var(--color-ink-soft)]/60 group-hover:bg-[var(--color-ink-mute)]"
                }`}
              />
              <span
                className="text-[8px] uppercase tracking-widest md:hidden"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <span
                  className={
                    isActive
                      ? "text-[var(--color-accent)]"
                      : isVisited
                        ? "text-[var(--color-ink-mute)]"
                        : "text-[var(--color-ink-soft)]"
                  }
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
