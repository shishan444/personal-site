"use client";

import { useTranslations } from "next-intl";
import { SectionReveal } from "@/components/site/section-reveal";

export interface HeroSectionProps {
  stats: {
    agentsActive: number;
    agentsBeta: number;
    essaysPublished: number;
    currentCalibre: string;
  };
}

export function HeroSection({ stats }: HeroSectionProps) {
  const t = useTranslations();
  return (
    <SectionReveal
      id="01"
      as="section"
      className="min-h-[100dvh] flex flex-col justify-center pl-6 md:pl-10 pr-6 md:pr-32 py-32 border-b border-[var(--color-line)]"
      activeClassName="opacity-100"
    >
      <div className="w-full space-y-12">
        <div
          className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {t("hero.eyebrow")}
        </div>

        <h1
          className="text-[clamp(48px,8vw,120px)] font-bold leading-[0.95] tracking-[-0.035em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span className="text-[var(--color-ink)]">{t("hero.title_line1")} </span>
          <span
            className="text-[var(--color-accent)]"
            style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}
          >
            {t("hero.title_line2_accent")}
          </span>
          <span className="text-[var(--color-ink)]"> {t("hero.title_line3")}</span>
        </h1>

        <p
          className="text-base md:text-lg text-[var(--color-ink-mute)] max-w-2xl leading-relaxed"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {t("hero.sub")}
        </p>

        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 max-w-3xl glass-panel p-6"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <HeroMeta
            label={t("agent.spec_uptime")}
            value={t("hero.meta_in_service", { count: stats.agentsActive })}
          />
          <HeroMeta label="BETA" value={t("hero.meta_in_beta", { count: stats.agentsBeta })} />
          <HeroMeta
            label={t("writing.section_label")}
            value={t("hero.meta_writing", { count: stats.essaysPublished })}
          />
          <HeroMeta label="CALIBRE" value={t("hero.meta_calibre", { cal: stats.currentCalibre })} />
        </div>
      </div>
    </SectionReveal>
  );
}

function HeroMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <div className="text-[9px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
        {label}
      </div>
      <div
        className="text-2xl md:text-3xl font-bold text-[var(--color-ink)] truncate leading-none"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
    </div>
  );
}
