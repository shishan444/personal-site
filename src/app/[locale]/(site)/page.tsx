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

  return (
    <>
      <div className="fixed top-4 right-4 z-30">
        <LanguageSwitcher />
      </div>
      <SearchPalette index={searchIndex} />

      <SubdialFrame
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
        rdMetaLine1={`${config?.currentVersion ?? "v0.4"} · UPDATED`}
        rdMetaLine2={config?.rdMeta2 ?? "NEXT"}
      />

      <main>
        <HeroSection stats={stats} />
        <WritingSection essays={essays} />
        <AgentsSection agents={agents} />
        <TimelineSection nodes={timeline} />
        <OutroSection />
      </main>
    </>
  );
}
