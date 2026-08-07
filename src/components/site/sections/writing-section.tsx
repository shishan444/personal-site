"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/shared";
import { SectionReveal } from "@/components/site/section-reveal";
import type { HomeEssay } from "@/lib/queries/site";

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export interface WritingSectionProps {
  essays: HomeEssay[];
}

export function WritingSection({ essays }: WritingSectionProps) {
  const t = useTranslations();
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      // 输入场景让路：文本框 / 可编辑区域内的方向键归还给光标移动
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      // 仅当本章节位于视口中央时才响应翻页，避免全局劫持方向键
      const section = document.getElementById("02");
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.5;
      if (!inView) return;
      if (e.key === "ArrowRight") {
        setActiveIdx((i) => Math.min(essays.length - 1, i + 1));
      } else {
        setActiveIdx((i) => Math.max(0, i - 1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [essays.length]);

  const active = essays[activeIdx];

  return (
    <SectionReveal
      id="02"
      as="section"
      className="min-h-screen border-b border-[var(--color-line)]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-0 pl-6 md:pl-10">
        <aside className="border-r border-[var(--color-line)] glass-bar py-8 pr-6 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
          <div
            className="text-[11px] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {t("writing.section_label")}
          </div>
          <h2
            className="text-xl font-bold mb-8 leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("writing.section_title")}{" "}
            <span
              className="text-[var(--color-accent)]"
              style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}
            >
              {t("writing.section_title_accent")}
            </span>
          </h2>

          <div className="space-y-1">
            <div
              className="grid grid-cols-[40px_1fr_60px_40px] gap-2 pb-2 border-b border-[var(--color-line)] text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <span>{t("writing.toc_header_no")}</span>
              <span>{t("writing.toc_header_title")}</span>
              <span>{t("writing.toc_header_date")}</span>
              <span className="text-right">{t("writing.toc_header_min")}</span>
            </div>
            {essays.map((e, idx) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`grid grid-cols-[40px_1fr_60px_40px] gap-2 py-2 text-left text-[13px] border-b border-[var(--color-line)]/40 transition-colors w-full ${
                  idx === activeIdx
                    ? "text-[var(--color-accent)] bg-[var(--color-glass)]"
                    : "text-[var(--color-ink)] hover:text-[var(--color-accent)]"
                }`}
                style={{ fontFamily: "var(--font-body)" }}
              >
                <span style={{ fontFamily: "var(--font-mono)" }} className="text-[10px] opacity-60">
                  {e.sn}
                </span>
                <span className="truncate">{e.title.replace(/<\/?em>/g, "")}</span>
                <span
                  style={{ fontFamily: "var(--font-mono)" }}
                  className="text-[10px] opacity-60"
                  suppressHydrationWarning
                >
                  {e.publishedAt ? formatDate(e.publishedAt) : "—"}
                </span>
                <span
                  style={{ fontFamily: "var(--font-mono)" }}
                  className="text-[10px] opacity-60 text-right"
                >
                  {e.readMinutes}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="pl-8 lg:pl-16 pr-6 lg:pr-32 py-8 lg:py-16 min-h-screen flex flex-col justify-center">
          {active && (
            <article key={active.id} className="space-y-6 max-w-3xl">
              <div className="flex items-center gap-3">
                <StatusBadge variant="warn">{t(`writing.tag_${active.typeTag}`)}</StatusBadge>
                <span
                  className="text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {active.sn}
                </span>
              </div>

              <h3
                className="text-4xl md:text-6xl font-bold leading-tight tracking-tight text-[var(--color-ink)]"
                style={{ fontFamily: "var(--font-display)" }}
                dangerouslySetInnerHTML={{ __html: active.title }}
              />

              <p
                className="text-xl text-[var(--color-ink-mute)] leading-relaxed"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {active.deck}
              </p>

              <div className="flex flex-wrap gap-2 pt-4">
                {active.topicTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 border border-[var(--color-line)] glass-chip text-[11px] uppercase tracking-widest text-[var(--color-ink-mute)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div
                className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink-soft)] pt-8"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {t("writing.slide_footer_hint")} · {activeIdx + 1}/{essays.length}
              </div>
            </article>
          )}
        </div>
      </div>
    </SectionReveal>
  );
}
