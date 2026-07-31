"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getPgliteDb } from "@/lib/db/pglite";
import { agents } from "@/lib/db/schema";
import type { AgentSpec } from "@/lib/db/schema/agents";

export interface AgentInput {
  sn: string;
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

  const db = await getPgliteDb();
  const id = crypto.randomUUID();
  const maxOrderRow = await db.select().from(agents).orderBy(desc(agents.order)).limit(1);
  const nextOrder = maxOrderRow.length > 0 ? maxOrderRow[0].order + 1 : 1;

  const [row] = await db
    .insert(agents)
    .values({
      id,
      sn: input.sn,
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

  revalidatePath("/[locale]");
  return { id: row.id, sn: row.sn };
}

export async function updateAgent(id: string, input: Partial<AgentInput>): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getPgliteDb();

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
  revalidatePath("/[locale]");
}

export async function deleteAgent(id: string): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getPgliteDb();
  await db.delete(agents).where(eq(agents.id, id));
  revalidatePath("/[locale]");
}

export async function reorderAgents(orderedIds: string[]): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (orderedIds.length === 0) return;
  const db = await getPgliteDb();
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(agents)
      .set({ order: i + 1 })
      .where(eq(agents.id, orderedIds[i]));
  }
  revalidatePath("/[locale]");
}
