"use client";

import { useTranslations } from "next-intl";
import { SectionReveal } from "@/components/site/section-reveal";

export function OutroSection() {
  const t = useTranslations();
  return (
    <SectionReveal
      id="05"
      as="section"
      className="min-h-screen flex flex-col justify-center pl-6 md:pl-10 pr-6 md:pr-32 py-32"
    >
      <div className="w-full space-y-12">
        <div
          className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {t("outro.eyebrow")}
        </div>

        <h2
          className="text-[clamp(40px,6vw,80px)] font-bold leading-[1.05] tracking-[-0.025em] text-[var(--color-ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t("outro.title_line1")}{" "}
          <span
            className="text-[var(--color-accent)]"
            style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}
          >
            {t("outro.title_line2_accent")}
          </span>{" "}
          {t("outro.title_line3")}{" "}
          <span
            className="text-[var(--color-accent)]"
            style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}
          >
            {t("outro.title_line4_accent")}
          </span>
        </h2>

        <p
          className="text-base md:text-lg text-[var(--color-ink-mute)] max-w-2xl leading-relaxed"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {t("outro.desc")}
        </p>

        <div className="grid grid-cols-2 gap-12 pt-8 border-t border-[var(--color-line)]">
          <div className="space-y-3">
            <div
              className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {t("outro.col_index")}
            </div>
            <ul className="space-y-1.5 text-sm" style={{ fontFamily: "var(--font-body)" }}>
              <li className="text-[var(--color-ink-mute)]">01 — HERO</li>
              <li className="text-[var(--color-ink-mute)]">02 — WRITING</li>
              <li className="text-[var(--color-ink-mute)]">03 — AGENTS</li>
              <li className="text-[var(--color-ink-mute)]">04 — TIMELINE</li>
              <li className="text-[var(--color-ink-mute)]">05 — OUTRO</li>
            </ul>
          </div>
          <div className="space-y-3">
            <div
              className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {t("outro.col_elsewhere")}
            </div>
            <ul className="space-y-1.5 text-sm" style={{ fontFamily: "var(--font-body)" }}>
              <li className="text-[var(--color-ink-mute)]">— GitHub</li>
              <li className="text-[var(--color-ink-mute)]">— X / Twitter</li>
              <li className="text-[var(--color-ink-mute)]">— Email</li>
            </ul>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
