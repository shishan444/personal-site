"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getPgliteDb } from "@/lib/db/pglite";
import { siteConfig } from "@/lib/db/schema";
import type { ChapterConfig, GlobalStats, SubdialsConfig } from "@/lib/db/schema/site_config";

export interface SiteConfigInput {
  siteName: string;
  subtitle: string;
  currentVersion: string;
  currentCalibre: string;
  heroSub: string;
  rdMeta1: string;
  rdMeta2: string;
  subdialsConfig: SubdialsConfig;
  chaptersConfig: ChapterConfig[];
  globalStats: GlobalStats;
  theme: string;
}

export async function updateSiteConfig(input: Partial<SiteConfigInput>): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getPgliteDb();
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.siteName !== undefined) patch.siteName = input.siteName;
  if (input.subtitle !== undefined) patch.subtitle = input.subtitle;
  if (input.currentVersion !== undefined) patch.currentVersion = input.currentVersion;
  if (input.currentCalibre !== undefined) patch.currentCalibre = input.currentCalibre;
  if (input.heroSub !== undefined) patch.heroSub = input.heroSub;
  if (input.rdMeta1 !== undefined) patch.rdMeta1 = input.rdMeta1;
  if (input.rdMeta2 !== undefined) patch.rdMeta2 = input.rdMeta2;
  if (input.subdialsConfig !== undefined) patch.subdialsConfig = input.subdialsConfig;
  if (input.chaptersConfig !== undefined) patch.chaptersConfig = input.chaptersConfig;
  if (input.globalStats !== undefined) patch.globalStats = input.globalStats;
  if (input.theme !== undefined) patch.theme = input.theme;
  await db.update(siteConfig).set(patch).where(eq(siteConfig.id, 1));
  revalidatePath("/[locale]");
}

export async function getSiteConfigForAdmin() {
  const db = await getPgliteDb();
  const row = (await db.select().from(siteConfig).where(eq(siteConfig.id, 1)).limit(1))[0];
  return row;
}
