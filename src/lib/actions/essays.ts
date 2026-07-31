"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getPgliteDb } from "@/lib/db/pglite";
import { essayRevisions, essays } from "@/lib/db/schema";
import { countWords, readingTime } from "@/lib/markdown";

export interface EssayInput {
  sn: string;
  lang: "zh" | "en";
  translationGroupId?: string;
  title: string;
  deck: string;
  body: string;
  typeTag: "essay" | "note" | "tutorial";
  topicTags: string[];
  status: "draft" | "published" | "archived";
  slug: string | null;
  isPinned?: boolean;
  relatedAgentId?: string | null;
  ogImageAssetId?: string | null;
  publishedAt?: Date;
}

export async function createEssay(input: EssayInput): Promise<{ id: string; sn: string }> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");

  const db = await getPgliteDb();
  const words = countWords(input.body);
  const id = crypto.randomUUID();
  const translationGroupId = input.translationGroupId ?? id;
  const publishedAt = input.status === "published" ? (input.publishedAt ?? new Date()) : null;

  const [row] = await db
    .insert(essays)
    .values({
      id,
      sn: input.sn,
      lang: input.lang,
      translationGroupId,
      title: input.title,
      deck: input.deck,
      body: input.body,
      typeTag: input.typeTag,
      topicTags: input.topicTags,
      status: input.status,
      publishedAt,
      slug: input.slug,
      isPinned: input.isPinned ?? false,
      relatedAgentId: input.relatedAgentId ?? null,
      ogImageAssetId: input.ogImageAssetId ?? null,
      authorId: session.userId,
      words,
      readMinutes: readingTime(words),
    })
    .returning();

  await db.insert(essayRevisions).values({
    essayId: row.id,
    snapshot: row as unknown as Record<string, unknown>,
    action: "created",
    createdBy: session.userId,
  });

  revalidatePath("/[locale]");
  return { id: row.id, sn: row.sn };
}

export async function updateEssay(
  id: string,
  input: Partial<EssayInput> & { body?: string },
): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");

  const db = await getPgliteDb();
  const existing = (await db.select().from(essays).where(eq(essays.id, id)).limit(1))[0];
  if (!existing) throw new Error("NOT_FOUND");

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.sn !== undefined) patch.sn = input.sn;
  if (input.title !== undefined) patch.title = input.title;
  if (input.deck !== undefined) patch.deck = input.deck;
  if (input.body !== undefined) {
    patch.body = input.body;
    const words = countWords(input.body);
    patch.words = words;
    patch.readMinutes = readingTime(words);
  }
  if (input.typeTag !== undefined) patch.typeTag = input.typeTag;
  if (input.topicTags !== undefined) patch.topicTags = input.topicTags;
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.isPinned !== undefined) patch.isPinned = input.isPinned;
  if (input.relatedAgentId !== undefined) patch.relatedAgentId = input.relatedAgentId;
  if (input.ogImageAssetId !== undefined) patch.ogImageAssetId = input.ogImageAssetId;

  if (input.status !== undefined && input.status !== existing.status) {
    patch.status = input.status;
    if (input.status === "published") {
      patch.publishedAt = existing.publishedAt ?? new Date();
    }
  }

  await db.update(essays).set(patch).where(eq(essays.id, id));

  const updated = (await db.select().from(essays).where(eq(essays.id, id)).limit(1))[0];
  await db.insert(essayRevisions).values({
    essayId: id,
    snapshot: updated as unknown as Record<string, unknown>,
    action: input.status === "published" ? "published" : "edited",
    createdBy: session.userId,
  });

  revalidatePath("/[locale]");
}

export async function publishEssay(id: string): Promise<void> {
  await updateEssay(id, { status: "published" });
}

export async function archiveEssay(id: string): Promise<void> {
  await updateEssay(id, { status: "archived" });
}

export async function restoreEssay(id: string): Promise<void> {
  await updateEssay(id, { status: "published" });
}

export async function deleteEssay(id: string): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getPgliteDb();
  await db.delete(essayRevisions).where(eq(essayRevisions.essayId, id));
  await db.delete(essays).where(eq(essays.id, id));
  revalidatePath("/[locale]");
}

export async function batchUpdateStatus(
  ids: string[],
  status: "draft" | "published" | "archived",
): Promise<number> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (ids.length === 0) return 0;
  const db = await getPgliteDb();
  const patch: Record<string, unknown> = { status, updatedAt: new Date() };
  if (status === "published") patch.publishedAt = new Date();
  await db.update(essays).set(patch).where(inArray(essays.id, ids));
  return ids.length;
}
