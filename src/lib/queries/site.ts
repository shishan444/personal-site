import { desc, eq } from "drizzle-orm";
import { getPgliteDb } from "@/lib/db/pglite";
import { agents, essays, siteConfig, timelineNodes } from "@/lib/db/schema";
import type { AgentSpec } from "@/lib/db/schema/agents";
import type { TimelineChange } from "@/lib/db/schema/timeline_nodes";

export interface SiteStats {
  agentsActive: number;
  agentsBeta: number;
  agentsComing: number;
  essaysPublished: number;
  currentCalibre: string;
}

export interface HomeEssay {
  id: string;
  sn: string;
  title: string;
  deck: string;
  typeTag: "essay" | "note" | "tutorial";
  topicTags: string[];
  publishedAt: Date | null;
  slug: string | null;
  words: number;
  readMinutes: number;
}

export interface HomeAgent {
  id: string;
  sn: string;
  name: string;
  desc: string;
  status: "active" | "beta" | "archived" | "coming";
  specs: AgentSpec[];
  launchType: "external" | "iframe" | "modal";
  launchUrl: string | null;
  order: number;
}

export interface HomeTimelineNode {
  id: string;
  version: string;
  name: string;
  desc: string;
  type: "genesis" | "first" | "normal" | "now" | "future";
  date: string;
  changes: TimelineChange[];
  filesChanged: number | null;
  linesAdd: number | null;
  linesDel: number | null;
  isNow: boolean;
}

export async function getHomeEssays(locale: string = "zh"): Promise<HomeEssay[]> {
  const db = await getPgliteDb();
  const rows = await db
    .select()
    .from(essays)
    .where(eq(essays.status, "published"))
    .orderBy(desc(essays.publishedAt))
    .limit(20);
  return rows
    .filter((e) => e.lang === locale)
    .map((e) => ({
      id: e.id,
      sn: e.sn,
      title: e.title,
      deck: e.deck,
      typeTag: e.typeTag,
      topicTags: e.topicTags,
      publishedAt: e.publishedAt,
      slug: e.slug,
      words: e.words,
      readMinutes: e.readMinutes,
    }));
}

export async function getHomeAgents(): Promise<HomeAgent[]> {
  const db = await getPgliteDb();
  const rows = await db.select().from(agents).orderBy(agents.order);
  return rows
    .filter((a) => a.status !== "archived")
    .map((a) => ({
      id: a.id,
      sn: a.sn,
      name: a.name,
      desc: a.desc,
      status: a.status,
      specs: a.specs,
      launchType: a.launchType,
      launchUrl: a.launchUrl,
      order: a.order,
    }));
}

export async function getHomeTimeline(): Promise<HomeTimelineNode[]> {
  const db = await getPgliteDb();
  const rows = await db.select().from(timelineNodes).orderBy(timelineNodes.date);
  return rows.map((t) => ({
    id: t.id,
    version: t.version,
    name: t.name,
    desc: t.desc,
    type: t.type,
    date: t.date,
    changes: t.changes,
    filesChanged: t.filesChanged,
    linesAdd: t.linesAdd,
    linesDel: t.linesDel,
    isNow: t.isNow,
  }));
}

export async function getSiteConfig() {
  const db = await getPgliteDb();
  const rows = await db.select().from(siteConfig).limit(1);
  return rows[0] ?? null;
}

export async function getSiteStats(): Promise<SiteStats> {
  const db = await getPgliteDb();
  const allAgents = await db.select().from(agents);
  const config = await getSiteConfig();
  const essaysPublishedRows = await db.select().from(essays).where(eq(essays.status, "published"));
  return {
    agentsActive: allAgents.filter((a) => a.status === "active").length,
    agentsBeta: allAgents.filter((a) => a.status === "beta").length,
    agentsComing: allAgents.filter((a) => a.status === "coming").length,
    essaysPublished: essaysPublishedRows.length,
    currentCalibre: config?.currentCalibre ?? "04",
  };
}
