import { and, desc, eq, ne } from "drizzle-orm";
import { getPgliteDb } from "@/lib/db/pglite";
import { agents, assetLinks, assets, essays } from "@/lib/db/schema";
import type { HomeAgent, HomeEssay } from "./site";

export interface EssayDetail extends HomeEssay {
  body: string;
  translationGroupId: string;
  relatedAgentId: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
}

export async function getEssayBySlug(slug: string, locale: string): Promise<EssayDetail | null> {
  const db = await getPgliteDb();
  const rows = await db.select().from(essays).where(eq(essays.slug, slug)).limit(1);
  if (rows.length === 0) return null;
  const e = rows[0];
  if (e.lang !== locale) return null;
  return {
    id: e.id,
    sn: e.sn,
    title: e.title,
    deck: e.deck,
    body: e.body,
    translationGroupId: e.translationGroupId,
    typeTag: e.typeTag,
    topicTags: e.topicTags,
    publishedAt: e.publishedAt,
    slug: e.slug,
    words: e.words,
    readMinutes: e.readMinutes,
    relatedAgentId: e.relatedAgentId,
    ogTitle: e.ogTitle,
    ogDescription: e.ogDescription,
  };
}

export async function getEssayTranslationSlug(
  groupId: string,
  targetLang: string,
  excludeId: string,
): Promise<string | null> {
  const db = await getPgliteDb();
  const rows = await db
    .select()
    .from(essays)
    .where(
      and(
        eq(essays.translationGroupId, groupId),
        eq(essays.lang, targetLang as "zh" | "en"),
        ne(essays.id, excludeId),
      ),
    )
    .limit(1);
  return rows[0]?.slug ?? null;
}

export async function getAdjacentEssays(
  publishedAt: Date,
  locale: string,
): Promise<{ prev: HomeEssay | null; next: HomeEssay | null }> {
  const db = await getPgliteDb();
  const all = await db.select().from(essays).where(eq(essays.status, "published"));
  const filtered = all
    .filter((e) => e.lang === (locale as "zh" | "en"))
    .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));
  const idx = filtered.findIndex((e) => e.publishedAt?.getTime() === publishedAt.getTime());
  return {
    prev: idx > 0 ? toHomeEssay(filtered[idx - 1]) : null,
    next: idx >= 0 && idx < filtered.length - 1 ? toHomeEssay(filtered[idx + 1]) : null,
  };
}

function toHomeEssay(e: typeof essays.$inferSelect): HomeEssay {
  return {
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
  };
}

export interface AgentDetail extends HomeAgent {
  longDesc: string | null;
  clickTarget: "internal" | "external";
  modalSize: "small" | "medium" | "large" | "full" | null;
  publishedAt: Date;
}

export async function getAgentBySn(sn: string): Promise<AgentDetail | null> {
  const db = await getPgliteDb();
  const rows = await db.select().from(agents).where(eq(agents.sn, sn)).limit(1);
  if (rows.length === 0) return null;
  const a = rows[0];
  return {
    id: a.id,
    sn: a.sn,
    name: a.name,
    desc: a.desc,
    longDesc: a.longDesc,
    status: a.status,
    specs: a.specs,
    launchType: a.launchType,
    launchUrl: a.launchUrl,
    clickTarget: a.clickTarget,
    modalSize: a.modalSize,
    order: a.order,
    publishedAt: a.publishedAt,
  };
}

export async function getAgentScreenshots(agentId: string) {
  const db = await getPgliteDb();
  const links = await db
    .select()
    .from(assetLinks)
    .where(
      and(
        eq(assetLinks.sourceType, "agent"),
        eq(assetLinks.sourceId, agentId),
        eq(assetLinks.usage, "screenshot"),
      ),
    );
  if (links.length === 0) return [];
  const assetsRows = await db.select().from(assets);
  return links
    .map((l) => assetsRows.find((a) => a.id === l.assetId))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
    .map((a) => ({
      id: a.id,
      url: `/uploads/${a.storagePath}`,
      caption: links.find((l) => l.assetId === a.id)?.caption ?? null,
    }));
}

export async function getRelatedEssays(agentId: string, locale: string): Promise<HomeEssay[]> {
  const db = await getPgliteDb();
  const rows = await db
    .select()
    .from(essays)
    .where(
      and(
        eq(essays.relatedAgentId, agentId),
        eq(essays.status, "published"),
        eq(essays.lang, locale as "zh" | "en"),
      ),
    )
    .orderBy(desc(essays.publishedAt));
  return rows.map(toHomeEssay);
}

export interface SearchEntry {
  type: "essay" | "agent" | "timeline";
  id: string;
  title: string;
  desc: string;
  href: string;
  tag: string;
}

export async function getSearchIndex(locale: string): Promise<SearchEntry[]> {
  const db = await getPgliteDb();
  const allEssays = await db
    .select()
    .from(essays)
    .where(and(eq(essays.status, "published"), eq(essays.lang, locale as "zh" | "en")));
  const allAgents = await db.select().from(agents);
  const { timelineNodes } = await import("@/lib/db/schema");

  const entries: SearchEntry[] = [];
  for (const e of allEssays) {
    if (e.slug) {
      entries.push({
        type: "essay",
        id: e.id,
        title: e.title.replace(/<\/?em>/g, ""),
        desc: e.deck,
        href: `/${locale}/writing/${e.slug}`,
        tag: e.typeTag,
      });
    }
  }
  for (const a of allAgents) {
    entries.push({
      type: "agent",
      id: a.id,
      title: a.name.replace(/<\/?em>/g, ""),
      desc: a.desc,
      href: `/${locale}/agents/${a.sn}`,
      tag: a.status,
    });
  }
  const timeline = await db.select().from(timelineNodes);
  for (const t of timeline) {
    entries.push({
      type: "timeline",
      id: t.id,
      title: `${t.version} · ${t.name.replace(/<\/?em>/g, "")}`,
      desc: t.desc,
      href: `/${locale}#04`,
      tag: t.type,
    });
  }
  return entries;
}

export async function getEssayAttachments(essayId: string) {
  const db = await getPgliteDb();
  const links = await db
    .select()
    .from(assetLinks)
    .where(
      and(
        eq(assetLinks.sourceType, "essay"),
        eq(assetLinks.sourceId, essayId),
        eq(assetLinks.usage, "attachment"),
      ),
    );
  if (links.length === 0) return [];
  const assetsRows = await db.select().from(assets);
  return links
    .map((l) => {
      const a = assetsRows.find((x) => x.id === l.assetId);
      if (!a) return null;
      return {
        id: a.id,
        url: `/uploads/${a.storagePath}`,
        filename: a.originalFilename,
        sizeBytes: a.sizeBytes,
        caption: l.caption,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}
