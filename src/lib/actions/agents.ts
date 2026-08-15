"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import type { AgentSpec } from "@/lib/db/schema/agents";
import { nextSequenceSn } from "@/lib/utils/sn";

export interface AgentInput {
  sn?: string;
  name: string;
  desc: string;
  longDesc?: string | null;
  status: "active" | "beta" | "archived" | "coming";
  specs: AgentSpec[];
  cardImageAssetId?: string | null;
  clickTarget: "internal" | "external";
  launchType: "external" | "iframe" | "modal";
  launchUrl?: string | null;
  modalSize?: "small" | "medium" | "large" | "full" | null;
  publishedAt?: Date;
}

export async function createAgent(input: AgentInput): Promise<{ id: string; sn: string }> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");

  const db = await getDb();
  const id = crypto.randomUUID();
  const maxOrderRow = await db.select().from(agents).orderBy(desc(agents.order)).limit(1);
  const nextOrder = maxOrderRow.length > 0 ? maxOrderRow[0].order + 1 : 1;

  const [row] = await db
    .insert(agents)
    .values({
      id,
      sn: input.sn ?? (await nextSequenceSn("agents", "CAL.A-")),
      name: input.name,
      desc: input.desc,
      longDesc: input.longDesc ?? null,
      status: input.status,
      specs: input.specs,
      cardImageAssetId: input.cardImageAssetId ?? null,
      clickTarget: input.clickTarget,
      launchType: input.launchType,
      launchUrl: input.launchUrl ?? null,
      modalSize: input.modalSize ?? null,
      order: nextOrder,
      publishedAt: input.publishedAt ?? new Date(),
    })
    .returning();

  await writeAuditLog({
    userId: session.userId,
    action: "create",
    targetType: "agent",
    targetId: row.id,
    summary: `创建 Agent ${row.sn}`,
  });

  revalidatePath("/[locale]");
  return { id: row.id, sn: row.sn };
}

export async function updateAgent(id: string, input: Partial<AgentInput>): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getDb();

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.sn !== undefined) patch.sn = input.sn;
  if (input.name !== undefined) patch.name = input.name;
  if (input.desc !== undefined) patch.desc = input.desc;
  if (input.longDesc !== undefined) patch.longDesc = input.longDesc;
  if (input.status !== undefined) patch.status = input.status;
  if (input.specs !== undefined) patch.specs = input.specs;
  if (input.cardImageAssetId !== undefined) patch.cardImageAssetId = input.cardImageAssetId;
  if (input.clickTarget !== undefined) patch.clickTarget = input.clickTarget;
  if (input.launchType !== undefined) patch.launchType = input.launchType;
  if (input.launchUrl !== undefined) patch.launchUrl = input.launchUrl;
  if (input.modalSize !== undefined) patch.modalSize = input.modalSize;

  await db.update(agents).set(patch).where(eq(agents.id, id));
  await writeAuditLog({
    userId: session.userId,
    action: "update",
    targetType: "agent",
    targetId: id,
    summary: "更新 Agent",
  });
  revalidatePath("/[locale]");
}

/** 删除到回收站（用户裁决 2026-08-15）：写 deletedAt，行保留。 */
export async function deleteAgent(id: string): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getDb();
  await db.update(agents).set({ deletedAt: new Date() }).where(eq(agents.id, id));
  await writeAuditLog({
    userId: session.userId,
    action: "delete",
    targetType: "agent",
    targetId: id,
    summary: "删除 Agent（移入回收站）",
  });
  revalidatePath("/[locale]");
}

/** 从回收站恢复。 */
export async function restoreAgentFromTrash(id: string): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getDb();
  await db.update(agents).set({ deletedAt: null }).where(eq(agents.id, id));
  await writeAuditLog({
    userId: session.userId,
    action: "restore",
    targetType: "agent",
    targetId: id,
    summary: "从回收站恢复 Agent",
  });
  revalidatePath("/[locale]");
}

/** 彻底删除（仅回收站内 Agent 可行），不可恢复。 */
export async function purgeAgent(id: string): Promise<{ ok: boolean; reason?: string }> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getDb();
  const target = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  if (target.length === 0) return { ok: false, reason: "NOT_FOUND" };
  if (target[0].deletedAt === null) return { ok: false, reason: "NOT_IN_TRASH" };
  await db.delete(agents).where(eq(agents.id, id));
  await writeAuditLog({
    userId: session.userId,
    action: "delete",
    targetType: "agent",
    targetId: id,
    summary: "彻底删除 Agent（不可恢复）",
  });
  revalidatePath("/[locale]");
  return { ok: true };
}

export async function reorderAgents(orderedIds: string[]): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (orderedIds.length === 0) return;
  const db = await getDb();
  // agents_order_idx 唯一索引：逐行交换会中途撞车，先整体抬升到 n+1..2n 再落位 1..n
  const n = orderedIds.length;
  for (let i = 0; i < n; i++) {
    await db
      .update(agents)
      .set({ order: n + i + 1 })
      .where(eq(agents.id, orderedIds[i]));
  }
  for (let i = 0; i < n; i++) {
    await db
      .update(agents)
      .set({ order: i + 1 })
      .where(eq(agents.id, orderedIds[i]));
  }
  await writeAuditLog({
    userId: session.userId,
    action: "update",
    targetType: "agent",
    summary: `调整 ${orderedIds.length} 个 Agent 排序`,
  });
  revalidatePath("/[locale]");
}
