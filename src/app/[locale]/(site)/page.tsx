export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { SubdialFrame } from "@/components/site";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { SearchPalette } from "@/components/site/search-palette";
import {
  AgentsSection,
  HeroSection,
  OutroSection,
  TimelineSection,
  WritingSection,
} from "@/components/site/sections";
import { getSearchIndex } from "@/lib/queries/detail";
import {
  getHomeAgents,
  getHomeEssays,
  getHomeTimeline,
  getSiteConfig,
  getSiteStats,
} from "@/lib/queries/site";
import { renderStatsTemplate, resolveChapters } from "@/lib/site/chapters";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [essays, agents, timeline, stats, config, searchIndex] = await Promise.all([
    getHomeEssays(locale),
    getHomeAgents(),
    getHomeTimeline(),
    getSiteStats(),
    getSiteConfig(),
    getSearchIndex(locale),
  ]);

  // 站点配置接线（审计 #24：chaptersConfig/subdialsConfig/globalStats 此前保存不生效）
  const chapters = resolveChapters(config?.chaptersConfig ?? null);
  const subdials = config?.subdialsConfig;
  const templateVars = {
    version: config?.currentVersion ?? "v0.4",
    agents_active: String(stats.agentsActive),
    agents_beta: String(stats.agentsBeta),
    essays: String(stats.essaysPublished),
    calibre: stats.currentCalibre,
  };
  const heroOverrides = config?.globalStats
    ? {
        inService: renderStatsTemplate(config.globalStats.inService, templateVars),
        inBeta: renderStatsTemplate(config.globalStats.inBeta, templateVars),
        writing: renderStatsTemplate(config.globalStats.writing, templateVars),
        calibre: renderStatsTemplate(config.globalStats.calibre, templateVars),
      }
    : undefined;

  return (
    <>
      <div className="fixed top-4 right-4 z-30">
        <LanguageSwitcher />
      </div>
      <SearchPalette index={searchIndex} />

      <SubdialFrame
        chapters={chapters}
        chapterMetas={{
          "01": { eyebrow: "CH.01", title: "HERO", desc: "工坊入口" },
          "02": {
            eyebrow: "CH.02",
            title: essays[0]?.title?.replace(/<\/?em>/g, "") ?? "WRITING",
            desc: essays[0]?.deck,
          },
          "03": {
            eyebrow: "CH.03",
            title: agents[0]?.name?.replace(/<\/?em>/g, "") ?? "AGENTS",
            desc: agents[0]?.desc,
          },
          "04": {
            eyebrow: "CH.04",
            title: timeline[timeline.length - 1]?.version ?? "TIMELINE",
            desc: timeline[timeline.length - 1]?.desc,
          },
          "05": { eyebrow: "CH.05", title: "OUTRO", desc: "传输结束" },
        }}
        rdMetaLine1={
          subdials?.rd?.meta1
            ? renderStatsTemplate(subdials.rd.meta1, templateVars)
            : `${config?.currentVersion ?? "v0.4"} · UPDATED`
        }
        rdMetaLine2={
          subdials?.rd?.meta2
            ? renderStatsTemplate(subdials.rd.meta2, templateVars)
            : (config?.rdMeta2 ?? "NEXT")
        }
      />

      <main>
        {chapters.map((chapter) => {
          switch (chapter.id) {
            case "01":
              return <HeroSection key={chapter.id} stats={stats} overrides={heroOverrides} />;
            case "02":
              return <WritingSection key={chapter.id} essays={essays} />;
            case "03":
              return <AgentsSection key={chapter.id} agents={agents} />;
            case "04":
              return <TimelineSection key={chapter.id} nodes={timeline} />;
            case "05":
              return <OutroSection key={chapter.id} />;
            default:
              return null;
          }
        })}
      </main>
    </>
  );
}
