import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getHomeAgents, getHomeEssays } from "@/lib/queries/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [];
  for (const locale of routing.locales) {
    staticEntries.push({
      url: `${baseUrl}/${locale}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, `${baseUrl}/${l}`])),
      },
    });
  }

  const [essaysZh, essaysEn, agents] = await Promise.all([
    getHomeEssays("zh").catch(() => []),
    getHomeEssays("en").catch(() => []),
    getHomeAgents().catch(() => []),
  ]);

  const essayEntries: MetadataRoute.Sitemap = [];
  for (const e of essaysZh) {
    if (!e.slug) continue;
    essayEntries.push({
      url: `${baseUrl}/zh/writing/${e.slug}`,
      lastModified: e.publishedAt ?? now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }
  for (const e of essaysEn) {
    if (!e.slug) continue;
    essayEntries.push({
      url: `${baseUrl}/en/writing/${e.slug}`,
      lastModified: e.publishedAt ?? now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  const agentEntries: MetadataRoute.Sitemap = [];
  for (const a of agents) {
    for (const locale of routing.locales) {
      agentEntries.push({
        url: `${baseUrl}/${locale}/agents/${a.sn}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return [...staticEntries, ...essayEntries, ...agentEntries];
}
