"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getPgliteDb } from "@/lib/db/pglite";
import { timelineNodes } from "@/lib/db/schema";
import type { TimelineChange } from "@/lib/db/schema/timeline_nodes";

export interface TimelineInput {
  version: string;
  name: string;
  desc: string;
  type: "genesis" | "first" | "normal" | "now" | "future";
  date: string;
  changes: TimelineChange[];
  filesChanged: number | null;
  linesAdd: number | null;
  linesDel: number | null;
  isNow?: boolean;
}

export async function createTimelineNode(input: TimelineInput): Promise<{ id: string }> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getPgliteDb();
  if (input.isNow) {
    await db.update(timelineNodes).set({ isNow: false }).where(eq(timelineNodes.isNow, true));
  }
  const [row] = await db
    .insert(timelineNodes)
    .values({
      version: input.version,
      name: input.name,
      desc: input.desc,
      type: input.type,
      date: input.date,
      changes: input.changes,
      filesChanged: input.filesChanged,
      linesAdd: input.linesAdd,
      linesDel: input.linesDel,
      isNow: input.isNow ?? false,
    })
    .returning();
  revalidatePath("/[locale]");
  return { id: row.id };
}

export async function updateTimelineNode(id: string, input: Partial<TimelineInput>): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getPgliteDb();
  if (input.isNow) {
    await db.update(timelineNodes).set({ isNow: false }).where(eq(timelineNodes.isNow, true));
  }
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.version !== undefined) patch.version = input.version;
  if (input.name !== undefined) patch.name = input.name;
  if (input.desc !== undefined) patch.desc = input.desc;
  if (input.type !== undefined) patch.type = input.type;
  if (input.date !== undefined) patch.date = input.date;
  if (input.changes !== undefined) patch.changes = input.changes;
  if (input.filesChanged !== undefined) patch.filesChanged = input.filesChanged;
  if (input.linesAdd !== undefined) patch.linesAdd = input.linesAdd;
  if (input.linesDel !== undefined) patch.linesDel = input.linesDel;
  if (input.isNow !== undefined) patch.isNow = input.isNow;
  await db.update(timelineNodes).set(patch).where(eq(timelineNodes.id, id));
  revalidatePath("/[locale]");
}

export async function setAsNow(id: string): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getPgliteDb();
  await db.update(timelineNodes).set({ isNow: false }).where(eq(timelineNodes.isNow, true));
  await db
    .update(timelineNodes)
    .set({ isNow: true, type: "now", updatedAt: new Date() })
    .where(eq(timelineNodes.id, id));
  revalidatePath("/[locale]");
}

export async function deleteTimelineNode(id: string): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getPgliteDb();
  await db.delete(timelineNodes).where(eq(timelineNodes.id, id));
  revalidatePath("/[locale]");
}
