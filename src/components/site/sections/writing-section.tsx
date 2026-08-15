"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { SectionReveal } from "@/components/site/section-reveal";
import { useRafThrottle } from "@/hooks/use-raf-throttle";
import type { HomeEssay } from "@/lib/queries/site";

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** 当前 locale（URL 首段）——查看原文链接前缀。 */
function localeHref(): string {
  if (typeof window === "undefined") return "zh";
  return window.location.pathname.split("/")[1] || "zh";
}

export interface WritingSectionProps {
  essays: HomeEssay[];
}

/** Writing 章节（改版 2026-08-15）：居中双栏「目录选择 → 摘要卡预览 → 新标签页读全文」。 */
export function WritingSection({ essays }: WritingSectionProps) {
  const t = useTranslations();
  const [activeIdx, setActiveIdx] = useState(0);
  const pinRef = useRef<HTMLDivElement | null>(null);

  // 滚动驱动翻页（用户裁决 #13B）：N×100vh 占位 + sticky，滚动段决定当前条目；
  // 键盘 ←→ / 目录点击 → 跳转对应滚动段。
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

  /** 键盘/目录切换 → 同步滚动位置到对应段（驱动与点击不打架）。 */
  function jumpTo(idx: number) {
    const pin = pinRef.current;
    if (!pin) {
      setActiveIdx(idx);
      return;
    }
    const top = pin.getBoundingClientRect().top + window.scrollY;
    const scrollable = pin.offsetHeight - window.innerHeight;
    const per = essays.length > 0 ? scrollable / essays.length : 0;
    // 落点取条目区间中央（idx + 0.5）：idx*N 边界处 floor 反算会被亚像素偏差打回上一档，
    // 造成「点击第二篇选中第一篇」错位；中央落点对浮点鲁棒。
    window.scrollTo({ top: top + per * (idx + 0.5), behavior: "smooth" });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
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
      {/* 占位 N×100vh + sticky：垂直滚动驱动条目切换（机制保留） */}
      <div
        ref={pinRef}
        style={{ height: `calc(${Math.max(1, essays.length)} * 100vh)` }}
        className="relative"
      >
        <div className="sticky top-0 min-h-screen flex flex-col justify-center">
          {/* 全站统一节奏：pl-6/pl-10 贴左 + pr-32 让位 RU 导航（同 hero/agents）。
              章节头部横排（同 agents/timeline），内容块垂直居中，LU/LD 悬浮于上下空白处不压内容。 */}
          <div className="pl-6 md:pl-10 pr-6 md:pr-32 py-16 w-full">
            {/* 章节头部（横排，与其他章节一致） */}
            <div className="mb-10">
              <div
                className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-2"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {t("writing.section_label")}
              </div>
              <h2
                className="text-4xl md:text-6xl font-bold mb-4 leading-tight tracking-tight"
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
              {/* 左：目录选择（剔除日期/分钟列，信息移摘要卡） */}
              <aside className="glass-bar border border-[var(--color-line)] p-6 lg:max-h-[62vh] lg:overflow-y-auto">
                <div className="space-y-1">
                  {essays.map((e, idx) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => jumpTo(idx)}
                      className={`toc-item w-full text-left text-sm py-2.5 px-3 ${
                        idx === activeIdx
                          ? "toc-active toc-active-glow bg-[var(--color-glass)] text-[var(--color-accent)]"
                          : "text-[var(--color-ink)]"
                      }`}
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      <span className="block truncate">{e.title.replace(/<\/?em>/g, "")}</span>
                    </button>
                  ))}
                </div>

                <div
                  className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink-soft)] pt-6 mt-2 border-t border-[var(--color-line)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {t("writing.slide_footer_hint")} · {activeIdx + 1}/{essays.length}
                </div>
              </aside>

              {/* 右：摘要卡（两行标题 + 配图 + 简介 + 查看原文） */}
              {active && (
                <article key={active.id} className="summary-enter glass-panel p-8 md:p-10">
                  <h3
                    className="text-3xl md:text-4xl font-bold leading-tight tracking-tight text-[var(--color-ink)] mb-3"
                    style={{ fontFamily: "var(--font-display)" }}
                    dangerouslySetInnerHTML={{ __html: active.title }}
                  />
                  <div
                    className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)] mb-8"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {active.publishedAt ? formatDate(active.publishedAt) : "—"} ·{" "}
                    {t(`writing.tag_${active.typeTag}`)}
                    {active.topicTags.length > 0 ? ` · ${active.topicTags.join("/")}` : ""} ·{" "}
                    {active.readMinutes} min
                  </div>

                  <div className="flex flex-col sm:flex-row gap-8 mb-8">
                    {active.ogImageUrl ? (
                      <div className="sm:w-[200px] shrink-0 aspect-square bg-[var(--color-bg-3)] border border-[var(--color-line)] overflow-hidden">
                        <img
                          src={active.ogImageUrl}
                          alt={active.title.replace(/<\/?em>/g, "")}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="sm:w-[200px] shrink-0 aspect-square bg-[var(--color-bg-3)] border border-[var(--color-line)] flex items-center justify-center">
                        <span
                          className="text-xs text-[var(--color-ink-soft)]"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {active.sn}
                        </span>
                      </div>
                    )}
                    <p
                      className="text-base text-[var(--color-ink-mute)] leading-relaxed line-clamp-4 flex-1"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {active.deck}
                    </p>
                  </div>

                  {active.slug && (
                    <a
                      href={`/${localeHref()}/writing/${active.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-xs uppercase tracking-widest px-5 py-3 border border-[var(--color-line)] glass-chip text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {t("writing.view_original")} ↗
                    </a>
                  )}
                </article>
              )}
            </div>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
