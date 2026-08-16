"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/shared";
import { SectionReveal } from "@/components/site/section-reveal";
import { Button } from "@/components/ui/button";
import type { HomeAgent } from "@/lib/queries/site";

export interface AgentsSectionProps {
  agents: HomeAgent[];
}

/** 滚动停稳的等待窗口：停稳后若点亮卡滚出视口，点亮转移到视口内最靠前的卡。 */
const SCROLL_SETTLE_MS = 150;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Agents 章节（用户裁决 2026-08-16 · 二次修订，P1-P15 详见 works/tmp/2026081610-agents滚动重构/）：
 * 局部横向滚动列表 + 点选点亮。
 * - 列表：overflow-x 原生容器（触摸横滑天然支持），卡片布局/尺寸/间距不变；
 * - 滚轮：区内垂直滚轮 → 列表连续横滚（内容溢出才具备此能力，动态判定）；不溢出/到边界 →
 *   放行页面滚动；触摸板横向手势（|deltaX|≥|deltaY|）交还原生横滚；
 * - 点选：点亮 + 特效，不搬运列表；选中卡不可见时仅做最小滚动露出（nearest）；
 * - 章节：取消 sticky 长占位与页面滚动驱动（修订 13B）——区外滚轮直接滚页面，便于快速滑过；
 * - 点亮唯一事实源 = 用户选择（点击/←→）；列表停稳后点亮卡滚出视口才转移给视口内最靠前卡。
 */
export function AgentsSection({ agents }: AgentsSectionProps) {
  const t = useTranslations();
  const trackRef = useRef<HTMLFieldSetElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  // 最新点亮的命令式镜像：select 内直接写入（不等 React 渲染周期），
  // 同一 tick 连发键盘事件（按住方向键）时逐次步进不丢步；渲染体不回写以免覆盖
  const activeIdxRef = useRef(0);

  /** LD 子表盘联动（spec 4.4 tick-flip）。 */
  const notifyActive = useCallback(
    (idx: number) => {
      window.dispatchEvent(
        new CustomEvent("atelier:active-item", {
          detail: {
            chapterId: "03",
            title: agents[idx]?.name.replace(/<\/?em>/g, "") ?? "",
            meta: agents[idx]?.sn ?? "",
          },
        }),
      );
    },
    [agents],
  );

  /** 点亮一张卡（唯一选择入口：点击 / ←→ / 停稳转移）。 */
  const select = useCallback(
    (idx: number) => {
      activeIdxRef.current = idx;
      setActiveIdx((i) => (i === idx ? i : idx));
      notifyActive(idx);
    },
    [notifyActive],
  );

  /** 选中卡完全可见 → 列表不动；否则最小滚动露出（block:nearest 防页面垂直跳动）。 */
  const ensureVisible = useCallback((idx: number) => {
    const track = trackRef.current;
    const card = track?.children[idx] as HTMLElement | undefined;
    if (!track || !card) return;
    const left = card.offsetLeft;
    const right = left + card.offsetWidth;
    const viewL = track.scrollLeft;
    const viewR = viewL + track.clientWidth;
    if (left >= viewL && right <= viewR) return;
    card.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      inline: "nearest",
      block: "nearest",
    });
  }, []);

  // 滚轮（P1/P2/P8/P12）：必须原生绑定 passive:false —— React 合成 wheel 是 passive，preventDefault 无效
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return; // 横向手势：交还原生横滚
      if (track.scrollWidth - track.clientWidth <= 1) return; // 不溢出：能力不存在，放行页面
      const atStart = track.scrollLeft <= 0;
      const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
      if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return; // 边界：放行防锁死
      e.preventDefault();
      track.scrollLeft += e.deltaY;
    };
    track.addEventListener("wheel", onWheel, { passive: false });
    return () => track.removeEventListener("wheel", onWheel);
  }, []);

  // 列表停稳（P14/P6）：点亮卡滚出视口 → 点亮转移给视口内最靠前的卡（LD 持续反映正在看的卡）
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const cards = Array.from(track.children) as HTMLElement[];
        const viewL = track.scrollLeft;
        const viewR = viewL + track.clientWidth;
        const visible = (c: HTMLElement) =>
          c.offsetLeft + c.offsetWidth > viewL && c.offsetLeft < viewR;
        const current = cards[activeIdxRef.current];
        if (current && visible(current)) return;
        const first = cards.find(visible);
        if (first) {
          const idx = cards.indexOf(first);
          if (idx !== activeIdxRef.current) select(idx);
        }
      }, SCROLL_SETTLE_MS);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      track.removeEventListener("scroll", onScroll);
    };
  }, [select]);

  // onKey 监听挂载一次，经 ref 取最新回调（声明先于使用，避免 TDZ 可读性陷阱）
  const selectRef = useRef(select);
  selectRef.current = select;
  const ensureVisibleRef = useRef(ensureVisible);
  ensureVisibleRef.current = ensureVisible;

  // 键盘 ←→（视口相交守卫 + 输入框守卫）：移动点亮 + 露出
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
      const section = document.getElementById("03");
      if (!section) return;
      const rect = section.getBoundingClientRect();
      if (rect.top >= window.innerHeight || rect.bottom <= 0) return;
      e.preventDefault();
      const next = activeIdxRef.current + (e.key === "ArrowRight" ? 1 : -1);
      if (next < 0 || next >= agents.length) return;
      selectRef.current(next);
      ensureVisibleRef.current(next);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [agents.length]);

  const statusVariant: Record<HomeAgent["status"], "active" | "warn" | "neutral" | "archived"> = {
    active: "active",
    beta: "warn",
    coming: "neutral",
    archived: "archived",
  };

  return (
    <SectionReveal id="03" as="section" className="section-fade-line">
      {/* 常规章节流（裁决 2026-08-16：取消 sticky 长占位，区外滚轮直接滚页面） */}
      <div className="py-16 md:py-24">
        <div className="pl-6 md:pl-10 pr-6 md:pr-32 pb-8">
          <div
            className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {t("agent.section_label")}
          </div>
          <h2
            className="text-4xl md:text-6xl font-bold mb-4 leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("agent.section_title")}{" "}
            <span
              className="text-[var(--color-accent)]"
              style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}
            >
              {t("agent.section_title_accent")}
            </span>
          </h2>
          <p
            className="text-sm text-[var(--color-ink-mute)] max-w-2xl"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {t("agent.section_meta", {
              active: agents.filter((a) => a.status === "active").length,
              beta: agents.filter((a) => a.status === "beta").length,
              coming: agents.filter((a) => a.status === "coming").length,
            })}
          </p>
        </div>

        {/* 横向滚动列表：overflow-x 原生容器（触摸可滑）；py-3 防 hover 浮起被裁剪；
            fieldset 提供 group 语义（biome useSemanticElements），min-w-0 覆盖其 min-content 默认 */}
        <fieldset
          ref={trackRef}
          aria-label={t("agent.section_title")}
          className="no-scrollbar min-w-0 flex gap-8 pl-6 md:pl-10 pr-6 md:pr-32 py-3 overflow-x-auto overscroll-x-contain"
        >
          {agents.map((agent, idx) => {
            const primary = agent.specs.find((s) => s.isPrimary) ?? agent.specs[0];
            return (
              <article
                key={agent.id}
                // biome-ignore lint/a11y/noNoninteractiveTabindex: 轮播卡片需键盘可达（Enter/Space 点亮），article 保留文档语义
                tabIndex={0}
                aria-current={idx === activeIdx ? "true" : undefined}
                aria-label={agent.name.replace(/<\/?em>/g, "")}
                onClick={(e) => {
                  // 内部按钮/链接的点击不触发点亮
                  if (e.target instanceof Element && e.target.closest("a, button")) return;
                  select(idx);
                  ensureVisible(idx);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    select(idx);
                    ensureVisible(idx);
                  }
                }}
                className={`flex-shrink-0 w-[80vw] md:w-[440px] glass-panel p-8 text-left cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                  idx === activeIdx ? "scale-100 glow-accent" : "scale-95"
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <StatusBadge variant={statusVariant[agent.status]} dot>
                    {t(`agent.status_${agent.status}`)}
                  </StatusBadge>
                  <span
                    className="text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {agent.sn}
                  </span>
                </div>

                <h3
                  className="text-3xl font-bold mb-3 leading-tight text-[var(--color-ink)]"
                  style={{ fontFamily: "var(--font-display)" }}
                  dangerouslySetInnerHTML={{ __html: agent.name }}
                />
                <p
                  className="text-sm text-[var(--color-ink-mute)] mb-8 leading-relaxed"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {agent.desc}
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8 border-t border-[var(--color-line)] pt-6">
                  {agent.specs.slice(0, 3).map((spec) => (
                    <div key={spec.id} className="space-y-1">
                      <div
                        className="text-[9px] uppercase tracking-widest text-[var(--color-ink-soft)]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {spec.label}
                      </div>
                      <div
                        className={`text-sm ${spec.isPrimary ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]"}`}
                        style={{
                          fontFamily: spec.isPrimary ? "var(--font-display)" : "var(--font-mono)",
                        }}
                      >
                        {spec.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  {agent.status !== "coming" && agent.launchUrl && (
                    <Button asChild>
                      <a href={agent.launchUrl} target="_blank" rel="noreferrer">
                        {t("agent.button_deploy")}
                      </a>
                    </Button>
                  )}
                  <Button variant="outline">{t("agent.button_notes")}</Button>
                </div>

                {primary && (
                  <div
                    className="mt-6 text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {primary.label} · {primary.value}
                  </div>
                )}
              </article>
            );
          })}
        </fieldset>

        <div
          className="pl-6 md:pl-10 pr-6 md:pr-32 pt-8 text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink-soft)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {t("agent.section_hint")} · {activeIdx + 1}/{agents.length}
        </div>
      </div>
    </SectionReveal>
  );
}
