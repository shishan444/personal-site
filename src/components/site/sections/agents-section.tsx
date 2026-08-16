// biome-ignore-all lint/a11y/useSemanticElements: 卡片需保留 article 文档语义承载轮播内容单元，改用原生 button 会破坏文档结构与测试选择器
"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/shared";
import { SectionReveal } from "@/components/site/section-reveal";
import { Button } from "@/components/ui/button";
import { useRafThrottle } from "@/hooks/use-raf-throttle";
import type { HomeAgent } from "@/lib/queries/site";

export interface AgentsSectionProps {
  agents: HomeAgent[];
}

/** 一次滚轮手势的翻卡锁窗口：触摸板惯性尾流在此窗口内只算同一次手势。 */
const WHEEL_LOCK_MS = 450;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Agents 章节（用户裁决 2026-08-16）：
 * - 传动：离散对齐 —— 滚动驱动保留（progress → floor 反算 idx），translateX 把选中卡对齐左锚点；
 * - 交互：卡片点选（选中态特效 + LD 联动）、卡片区滚轮翻卡（指针在区内=翻卡，区外=滚页面，
 *   边界放行防锁死）、键盘 ←→ 切卡。触摸设备不劫持，仍走页面滚动驱动。
 */
export function AgentsSection({ agents }: AgentsSectionProps) {
  const t = useTranslations();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [trackOffset, setTrackOffset] = useState(0);
  const wheelLockRef = useRef(0);
  // wheel/键盘监听里读最新选中，避免闭包过期
  const activeIdxRef = useRef(0);
  activeIdxRef.current = activeIdx;

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

  /** 选中卡对齐偏移：base 是第 0 张卡的自然位置，选中卡平移到该锚点（SSR 首渲恒 0，无 hydration 偏差）。 */
  const measureOffset = useCallback((idx: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const base = (track.children[0] as HTMLElement | undefined)?.offsetLeft ?? 0;
    const target = (track.children[idx] as HTMLElement | undefined)?.offsetLeft ?? base;
    return base - target;
  }, []);

  /** 跳到第 idx 张卡：滚动段中央落点（Writing 错位修复结论——边界落点会被亚像素偏差打回上一档）。 */
  const jumpTo = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(agents.length - 1, idx));
      setActiveIdx(clamped);
      const pin = pinRef.current;
      if (!pin) return;
      const top = pin.getBoundingClientRect().top + window.scrollY;
      const scrollable = pin.offsetHeight - window.innerHeight;
      const per = agents.length > 0 ? scrollable / agents.length : 0;
      window.scrollTo({
        top: Math.max(0, top + per * (clamped + 0.5)),
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    },
    [agents.length],
  );
  const jumpToRef = useRef(jumpTo);
  jumpToRef.current = jumpTo;

  // 滚动驱动（裁决 #13B 保留）：progress → floor 反算 idx（N 个均匀段与卡片一一对应）
  const updateProgress = useRafThrottle(() => {
    const pin = pinRef.current;
    if (!pin) return;
    const rect = pin.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
    const next = Math.min(agents.length - 1, Math.max(0, Math.floor(progress * agents.length)));
    setActiveIdx((i) => (i === next ? i : next));
  });

  useEffect(() => {
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [updateProgress]);

  // 离散对齐 + LD 通知：activeIdx 变化的统一出口（滚动/点击/滚轮/键盘均汇于此）
  useEffect(() => {
    notifyActive(activeIdx);
    setTrackOffset(measureOffset(activeIdx));
  }, [activeIdx, notifyActive, measureOffset]);

  // resize 后卡片几何变化 → 重算对齐（不通知 LD，无选中变化）
  useEffect(() => {
    function onResize() {
      setTrackOffset(measureOffset(activeIdxRef.current));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measureOffset]);

  // 滚轮劫持（T2）：指针在卡片区 = 翻卡；边界（首卡向上/末卡向下）放行页面滚动。
  // 必须原生绑定 passive:false —— React 合成 wheel 是 passive 的，preventDefault 无效。
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      if (performance.now() < wheelLockRef.current) {
        e.preventDefault(); // 手势尾流：继续吞掉，避免页面中途起滚
        return;
      }
      const next = activeIdxRef.current + (e.deltaY > 0 ? 1 : -1);
      if (next < 0 || next >= agents.length) return; // 边界：放行
      e.preventDefault();
      wheelLockRef.current = performance.now() + WHEEL_LOCK_MS;
      jumpToRef.current(next);
    };
    track.addEventListener("wheel", onWheel, { passive: false });
    return () => track.removeEventListener("wheel", onWheel);
  }, [agents.length]);

  // 键盘 ←→（T4）：Agents sticky 在视口时翻卡；输入框聚焦守卫（同 Writing）
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
      const inView = rect.top < window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.5;
      if (!inView) return;
      e.preventDefault();
      jumpToRef.current(activeIdxRef.current + (e.key === "ArrowRight" ? 1 : -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const statusVariant: Record<HomeAgent["status"], "active" | "warn" | "neutral" | "archived"> = {
    active: "active",
    beta: "warn",
    coming: "neutral",
    archived: "archived",
  };

  return (
    <SectionReveal id="03" as="section" className="section-fade-line">
      {/* 占位 N×67vh + sticky 全屏：垂直滚动驱动水平推进（spec 4.4 传动机制） */}
      <div
        ref={pinRef}
        style={{ height: `calc(${Math.max(1, agents.length)} * 67vh)` }}
        className="relative"
      >
        <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
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

          <div
            ref={trackRef}
            className="flex gap-8 pl-6 md:pl-10 pr-6 md:pr-32 will-change-transform transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:duration-0"
            style={{ transform: `translate3d(${trackOffset}px, 0, 0)` }}
          >
            {agents.map((agent, idx) => {
              const primary = agent.specs.find((s) => s.isPrimary) ?? agent.specs[0];
              return (
                <article
                  key={agent.id}
                  // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: 轮播卡片选中交互无原生语义元素可承载，按 ARIA button 模式实现（Enter/Space 已处理）
                  role="button"
                  tabIndex={0}
                  aria-pressed={idx === activeIdx}
                  aria-label={agent.name.replace(/<\/?em>/g, "")}
                  onClick={(e) => {
                    // 内部按钮/链接的点击不触发选卡
                    if (e.target instanceof Element && e.target.closest("a, button")) return;
                    jumpTo(idx);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      jumpTo(idx);
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
          </div>

          <div
            className="pl-6 md:pl-10 pr-6 md:pr-32 pt-8 text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink-soft)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {t("agent.section_hint")} · {activeIdx + 1}/{agents.length}
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
