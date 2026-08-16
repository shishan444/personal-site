"use server";

import { desc, eq, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { purgeAgent } from "@/lib/actions/agents";
import { purgeEssay } from "@/lib/actions/essays";
import { purgeAsset } from "@/lib/assets";
import { writeAuditLog } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { agents, assetLinks, assets, essays } from "@/lib/db/schema";

export interface TrashItem {
  id: string;
  kind: "essay" | "agent" | "asset";
  title: string;
  meta: string;
  deletedAt: Date;
}

/** 回收站列表（用户裁决 2026-08-15：删除先进回收站，二次删除才彻底）。 */
export async function listTrash(): Promise<TrashItem[]> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getDb();

  const essayRows = await db
    .select()
    .from(essays)
    .where(isNotNull(essays.deletedAt))
    .orderBy(desc(essays.deletedAt));
  const agentRows = await db
    .select()
    .from(agents)
    .where(isNotNull(agents.deletedAt))
    .orderBy(desc(agents.deletedAt));
  const assetRows = await db
    .select()
    .from(assets)
    .where(isNotNull(assets.deletedAt))
    .orderBy(desc(assets.deletedAt));

  return [
    ...essayRows.map((e) => ({
      id: e.id,
      kind: "essay" as const,
      title: e.title.replace(/<\/?em>/g, ""),
      meta: e.sn,
      deletedAt: e.deletedAt as Date,
    })),
    ...agentRows.map((a) => ({
      id: a.id,
      kind: "agent" as const,
      title: a.name.replace(/<\/?em>/g, ""),
      meta: a.sn,
      deletedAt: a.deletedAt as Date,
    })),
    ...assetRows.map((a) => ({
      id: a.id,
      kind: "asset" as const,
      title: a.originalFilename,
      meta: `${a.mimeType} · ${Math.round(a.sizeBytes / 1024)} KB`,
      deletedAt: a.deletedAt as Date,
    })),
  ].sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());
}

/** 恢复（按类型分派）。 */
export async function restoreFromTrash(kind: TrashItem["kind"], id: string): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getDb();
  if (kind === "essay") {
    await db.update(essays).set({ deletedAt: null }).where(eq(essays.id, id));
  } else if (kind === "agent") {
    await db.update(agents).set({ deletedAt: null }).where(eq(agents.id, id));
  } else {
    await db.update(assets).set({ deletedAt: null }).where(eq(assets.id, id));
  }
  await writeAuditLog({
    userId: session.userId,
    action: "restore",
    targetType: kind,
    targetId: id,
    summary: "从回收站恢复",
  });
  revalidatePath("/[locale]/admin/trash");
  revalidatePath("/[locale]");
}

/** 彻底删除（按类型分派，仅回收站内条目可行）。 */
export async function purgeFromTrash(
  kind: TrashItem["kind"],
  id: string,
): Promise<{ ok: boolean; reason?: string }> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  let result: { ok: boolean; reason?: string };
  if (kind === "essay") {
    result = await purgeEssay(id);
  } else if (kind === "agent") {
    result = await purgeAgent(id);
  } else {
    result = await purgeAsset(id);
  }
  revalidatePath("/[locale]/admin/trash");
  return result;
}

/** 附件外链（用户裁决 2026-08-15）：为文章添加云盘链接型附件，点击跳转，解决超限文件。 */
export async function addExternalAttachment(
  essayId: string,
  url: string,
  label: string,
): Promise<{ ok: boolean; reason?: string }> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (!/^https?:\/\//.test(url)) return { ok: false, reason: "INVALID_URL" };
  const db = await getDb();
  await db.insert(assetLinks).values({
    assetId: null,
    externalUrl: url,
    sourceType: "essay",
    sourceId: essayId,
    usage: "attachment",
    caption: label || url,
  });
  await writeAuditLog({
    userId: session.userId,
    action: "create",
    targetType: "asset_link",
    targetId: essayId,
    summary: `添加外链附件 ${label || url}`,
  });
  revalidatePath("/[locale]/admin/writing");
  return { ok: true };
}
