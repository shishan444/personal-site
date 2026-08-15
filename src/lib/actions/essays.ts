"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { essayRevisions, essays } from "@/lib/db/schema";
import { countWords, readingTime } from "@/lib/markdown";
import { nextSequenceSn } from "@/lib/utils/sn";

export interface EssayInput {
  sn?: string;
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

  const db = await getDb();
  const words = countWords(input.body);
  const id = crypto.randomUUID();
  const translationGroupId = input.translationGroupId ?? id;
  const publishedAt = input.status === "published" ? (input.publishedAt ?? new Date()) : null;

  const [row] = await db
    .insert(essays)
    .values({
      id,
      sn: input.sn ?? (await nextSequenceSn("essays", "SN-")),
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

  await writeAuditLog({
    userId: session.userId,
    action: "create",
    targetType: "essay",
    targetId: row.id,
    summary: `创建文章 ${row.sn}`,
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

  const db = await getDb();
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
  const statusChanged = input.status !== undefined && input.status !== existing.status;
  await db.insert(essayRevisions).values({
    essayId: id,
    snapshot: updated as unknown as Record<string, unknown>,
    action: !statusChanged
      ? "edited"
      : input.status === "published"
        ? "published"
        : input.status === "archived"
          ? "archived"
          : "edited",
    createdBy: session.userId,
  });

  await writeAuditLog({
    userId: session.userId,
    action: !statusChanged
      ? "update"
      : input.status === "published"
        ? "publish"
        : input.status === "archived"
          ? "archive"
          : "update",
    targetType: "essay",
    targetId: id,
    summary: `更新文章 ${existing.sn}`,
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

/** 删除到回收站（用户裁决 2026-08-15）：写 deletedAt，正文与 revisions 全部保留。 */
export async function deleteEssay(id: string): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getDb();
  await db.update(essays).set({ deletedAt: new Date() }).where(eq(essays.id, id));
  await writeAuditLog({
    userId: session.userId,
    action: "delete",
    targetType: "essay",
    targetId: id,
    summary: "删除文章（移入回收站）",
  });
  revalidatePath("/[locale]");
}

/** 从回收站恢复。 */
export async function restoreEssayFromTrash(id: string): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getDb();
  await db.update(essays).set({ deletedAt: null }).where(eq(essays.id, id));
  await writeAuditLog({
    userId: session.userId,
    action: "restore",
    targetType: "essay",
    targetId: id,
    summary: "从回收站恢复文章",
  });
  revalidatePath("/[locale]");
}

/** 彻底删除（仅回收站内文章可行）：删除行与全部 revisions，不可恢复。 */
export async function purgeEssay(id: string): Promise<{ ok: boolean; reason?: string }> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getDb();
  const target = await db.select().from(essays).where(eq(essays.id, id)).limit(1);
  if (target.length === 0) return { ok: false, reason: "NOT_FOUND" };
  if (target[0].deletedAt === null) return { ok: false, reason: "NOT_IN_TRASH" };
  await db.delete(essayRevisions).where(eq(essayRevisions.essayId, id));
  await db.delete(essays).where(eq(essays.id, id));
  await writeAuditLog({
    userId: session.userId,
    action: "delete",
    targetType: "essay",
    targetId: id,
    summary: "彻底删除文章（不可恢复）",
  });
  revalidatePath("/[locale]");
  return { ok: true };
}

export async function batchUpdateStatus(
  ids: string[],
  status: "draft" | "published" | "archived",
): Promise<number> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (ids.length === 0) return 0;
  const db = await getDb();
  const patch: Record<string, unknown> = { status, updatedAt: new Date() };
  if (status === "published") patch.publishedAt = new Date();
  await db.update(essays).set(patch).where(inArray(essays.id, ids));
  await writeAuditLog({
    userId: session.userId,
    action: status === "published" ? "publish" : status === "archived" ? "archive" : "update",
    targetType: "essay",
    summary: `批量更新 ${ids.length} 篇文章状态为 ${status}`,
    metadata: { ids },
  });
  return ids.length;
}

export async function restoreEssayRevision(essayId: string, revisionId: string): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");

  const db = await getDb();
  const revision = (
    await db
      .select()
      .from(essayRevisions)
      .where(and(eq(essayRevisions.id, revisionId), eq(essayRevisions.essayId, essayId)))
      .limit(1)
  )[0];
  if (!revision) throw new Error("NOT_FOUND");

  const snap = revision.snapshot as Record<string, unknown>;
  const body = typeof snap.body === "string" ? snap.body : "";
  const words = countWords(body);
  await db
    .update(essays)
    .set({
      title: typeof snap.title === "string" ? snap.title : "",
      deck: typeof snap.deck === "string" ? snap.deck : "",
      body,
      words,
      readMinutes: readingTime(words),
      typeTag: snap.typeTag as "essay" | "note" | "tutorial",
      topicTags: Array.isArray(snap.topicTags) ? (snap.topicTags as string[]) : [],
      slug: typeof snap.slug === "string" ? snap.slug : null,
      updatedAt: new Date(),
    })
    .where(eq(essays.id, essayId));

  const restored = (await db.select().from(essays).where(eq(essays.id, essayId)).limit(1))[0];
  await db.insert(essayRevisions).values({
    essayId,
    snapshot: restored as unknown as Record<string, unknown>,
    action: "restored",
    createdBy: session.userId,
  });

  await writeAuditLog({
    userId: session.userId,
    action: "update",
    targetType: "essay",
    targetId: essayId,
    summary: `恢复文章 ${restored.sn} 到历史版本`,
  });
  revalidatePath("/[locale]");
}
