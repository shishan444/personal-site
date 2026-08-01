"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/shared";
import { SectionReveal } from "@/components/site/section-reveal";
import type { HomeTimelineNode } from "@/lib/queries/site";

export interface TimelineSectionProps {
  nodes: HomeTimelineNode[];
}

const NODE_VARIANT: Record<
  HomeTimelineNode["type"],
  "neutral" | "active" | "warn" | "danger" | "archived"
> = {
  genesis: "neutral",
  first: "active",
  normal: "neutral",
  now: "warn",
  future: "archived",
};

export function TimelineSection({ nodes }: TimelineSectionProps) {
  const t = useTranslations();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    function onScroll() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const sectionTop = rect.top;
      const sectionBottom = rect.bottom;
      const inView = sectionTop < viewportH * 0.5 && sectionBottom > viewportH * 0.5;
      if (!inView) return;

      const rangeStart = viewportH * 0.5;
      const rangeEnd = -(rect.height - viewportH * 0.5);
      const span = rangeStart - rangeEnd;
      const current = Math.min(rangeStart, Math.max(rangeEnd, sectionTop));
      const ratio = (rangeStart - current) / span;
      const next = Math.min(nodes.length - 1, Math.floor(ratio * nodes.length));
      setActiveIdx(next);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [nodes.length]);

  const totalWidth = Math.max(1, nodes.length * 220);
  const active = nodes[activeIdx];

  return (
    <SectionReveal id="04" as="section" className="border-b border-[var(--color-line)]">
      <div className="pl-6 md:pl-10 pr-6 md:pr-32 pt-32 pb-12">
        <div
          className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-2"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {t("timeline.section_label")}
        </div>
        <h2
          className="text-4xl md:text-6xl font-bold mb-4 leading-tight tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t("timeline.section_title")}{" "}
          <span
            className="text-[var(--color-accent)]"
            style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}
          >
            {t("timeline.section_title_accent")}
          </span>
        </h2>
        <p
          className="text-sm text-[var(--color-ink-mute)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {t("timeline.section_meta")}
        </p>
      </div>

      <div ref={trackRef} className="pl-6 md:pl-10 pr-6 md:pr-32 pb-12 overflow-hidden">
        <div className="relative" style={{ height: 120 }}>
          <svg
            width={totalWidth}
            height="120"
            viewBox={`0 0 ${totalWidth} 120`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMinYMid meet"
          >
            <line
              x1="0"
              y1="60"
              x2={totalWidth}
              y2="60"
              stroke="var(--color-ink-mute)"
              strokeWidth="1"
            />
            {nodes.map((node, idx) => {
              const x = (idx + 0.5) * (totalWidth / nodes.length);
              const reached = true;
              return (
                <g key={node.id}>
                  <circle
                    cx={x}
                    cy="60"
                    r={idx === activeIdx ? 8 : 5}
                    fill={idx === activeIdx ? "var(--color-accent)" : "var(--color-ink-mute)"}
                    stroke={idx === activeIdx ? "var(--color-accent)" : "transparent"}
                    strokeWidth="2"
                  />
                  <text
                    x={x}
                    y="30"
                    textAnchor="middle"
                    fontSize="11"
                    fill={idx === activeIdx ? "var(--color-accent)" : "var(--color-ink-soft)"}
                    style={{
                      fontFamily: "var(--font-mono)",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                    }}
                  >
                    {node.version}
                  </text>
                  <text
                    x={x}
                    y="100"
                    textAnchor="middle"
                    fontSize="9"
                    fill="var(--color-ink-soft)"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {node.date}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="pl-6 md:pl-10 pr-6 md:pr-32 pb-32 max-w-3xl">
        {active && (
          <article key={active.id} className="space-y-4">
            <div className="flex items-center gap-3">
              <StatusBadge variant={NODE_VARIANT[active.type]} dot>
                {t(`timeline.node_${active.type}`)}
              </StatusBadge>
              <span
                className="text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {active.version}
              </span>
            </div>
            <h3
              className="text-2xl md:text-3xl font-bold leading-tight text-[var(--color-ink)]"
              style={{ fontFamily: "var(--font-display)" }}
              dangerouslySetInnerHTML={{ __html: active.name }}
            />
            <p
              className="text-sm text-[var(--color-ink-mute)] leading-relaxed"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {active.desc}
            </p>
            {active.changes.length > 0 && (
              <ul className="space-y-2 pt-4 border-t border-[var(--color-line)]">
                {active.changes.map((change) => (
                  <li key={change.id} className="flex items-center gap-3 text-sm">
                    <StatusBadge
                      variant={
                        change.type === "add" ? "active" : change.type === "mod" ? "warn" : "danger"
                      }
                    >
                      {t(`timeline.change_${change.type}`)}
                    </StatusBadge>
                    <span
                      style={{ fontFamily: "var(--font-body)" }}
                      className="text-[var(--color-ink)]"
                    >
                      {change.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {active.filesChanged !== null && (
              <div
                className="flex gap-6 pt-4 text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <span>
                  {t("timeline.detail_files_changed")}: {active.filesChanged}
                </span>
                {active.linesAdd !== null && (
                  <span className="text-[var(--color-accent-2)]">+{active.linesAdd}</span>
                )}
                {active.linesDel !== null && (
                  <span className="text-[var(--color-danger)]">−{active.linesDel}</span>
                )}
              </div>
            )}
          </article>
        )}
      </div>
    </SectionReveal>
  );
}
