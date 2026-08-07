"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/shared";
import { SectionReveal } from "@/components/site/section-reveal";
import { Button } from "@/components/ui/button";
import { useRafThrottle } from "@/hooks/use-raf-throttle";
import type { HomeAgent } from "@/lib/queries/site";

export interface AgentsSectionProps {
  agents: HomeAgent[];
}

export function AgentsSection({ agents }: AgentsSectionProps) {
  const t = useTranslations();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // track 是 overflow-x-auto 元素级横向滚动：scroll 事件不冒泡到 window，
  // 必须监听 track 自身；激活位置由 scrollLeft/(scrollWidth-clientWidth) 得出。
  const updateActive = useRafThrottle(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const ratio = max > 0 ? el.scrollLeft / max : 0;
    const next = Math.min(agents.length - 1, Math.max(0, Math.round(ratio * (agents.length - 1))));
    setActiveIdx(next);
  });

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateActive, { passive: true });
    updateActive();
    return () => el.removeEventListener("scroll", updateActive);
  }, [updateActive]);

  const statusVariant: Record<HomeAgent["status"], "active" | "warn" | "neutral" | "archived"> = {
    active: "active",
    beta: "warn",
    coming: "neutral",
    archived: "archived",
  };

  return (
    <SectionReveal id="03" as="section" className="section-fade-line">
      <div className="pl-6 md:pl-10 pr-6 md:pr-32 pt-32 pb-12">
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
        className="flex gap-8 overflow-x-auto pl-6 md:pl-10 pr-6 md:pr-32 pb-32 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {agents.map((agent, idx) => {
          const primary = agent.specs.find((s) => s.isPrimary) ?? agent.specs[0];
          return (
            <article
              key={agent.id}
              className={`flex-shrink-0 w-[80vw] md:w-[440px] glass-panel p-8 snap-center transition-all duration-300 ${
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
        className="pl-6 md:pl-10 pr-6 md:pr-32 pb-12 text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink-soft)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {t("agent.section_hint")} · {activeIdx + 1}/{agents.length}
      </div>
    </SectionReveal>
  );
}
