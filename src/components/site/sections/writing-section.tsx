"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/shared";
import { SectionReveal } from "@/components/site/section-reveal";
import { useRafThrottle } from "@/hooks/use-raf-throttle";
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
  const pinRef = useRef<HTMLDivElement | null>(null);

  // 滚动驱动翻页（用户裁决 2026-08-15 #13B）：N×100vh 占位 + sticky，
  // 垂直滚动段决定当前 slide；键盘 ←→ 保留（跳到对应滚动段）。
  const updateFromScroll = useRafThrottle(() => {
    const pin = pinRef.current;
    if (!pin) return;
    const rect = pin.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    if (scrollable <= 0) return;
    const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
    const next = Math.min(essays.length - 1, Math.floor(progress * essays.length));
    setActiveIdx((i) => (i === next ? i : next));
    window.dispatchEvent(
      new CustomEvent("atelier:active-item", {
        detail: {
          chapterId: "02",
          title: essays[next]?.title?.replace(/<\/?em>/g, "") ?? "",
          meta: essays[next]?.sn ?? "",
        },
      }),
    );
  });

  useEffect(() => {
    window.addEventListener("scroll", updateFromScroll, { passive: true });
    updateFromScroll();
    return () => window.removeEventListener("scroll", updateFromScroll);
  }, [updateFromScroll]);

  /** 键盘切换 → 同步滚动位置到对应 slide 段（驱动与键盘不打架）。 */
  function jumpTo(idx: number) {
    const pin = pinRef.current;
    if (!pin) {
      setActiveIdx(idx);
      return;
    }
    const top = pin.getBoundingClientRect().top + window.scrollY;
    const scrollable = pin.offsetHeight - window.innerHeight;
    const per = essays.length > 0 ? scrollable / essays.length : 0;
    window.scrollTo({ top: top + per * idx, behavior: "smooth" });
  }

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
        jumpTo(Math.min(essays.length - 1, activeIdx + 1));
      } else {
        jumpTo(Math.max(0, activeIdx - 1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [essays.length, activeIdx]);

  const active = essays[activeIdx];

  return (
    <SectionReveal id="02" as="section" className="section-fade-line">
      {/* 占位 N×100vh + sticky：垂直滚动驱动 slide 切换（spec 4.3） */}
      <div
        ref={pinRef}
        style={{ height: `calc(${Math.max(1, essays.length)} * 100vh)` }}
        className="relative"
      >
        <div className="sticky top-0 min-h-screen grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-0 pl-6 md:pl-10">
          <aside className="border-r border-[var(--color-line)] glass-bar py-8 pr-8">
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
                  onClick={() => jumpTo(idx)}
                  className={`grid grid-cols-[40px_1fr_60px_40px] gap-2 py-2 text-left text-[13px] border-b border-[var(--color-line)]/40 transition-colors w-full ${
                    idx === activeIdx
                      ? "text-[var(--color-accent)] bg-[var(--color-glass)] toc-active-glow"
                      : "text-[var(--color-ink)] hover:text-[var(--color-accent)]"
                  }`}
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <span
                    style={{ fontFamily: "var(--font-mono)" }}
                    className="text-[10px] opacity-60"
                  >
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
      </div>
    </SectionReveal>
  );
}
