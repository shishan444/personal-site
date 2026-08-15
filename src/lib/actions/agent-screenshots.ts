"use server";

import { and, asc, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { assetLinks, assets } from "@/lib/db/schema";

const SOURCE_TYPE = "agent";
const USAGE = "screenshot";

export interface AgentScreenshotLink {
  linkId: string;
  assetId: string | null;
  url: string;
  caption: string | null;
  orderIndex: number;
}

export async function listAgentScreenshotLinks(agentId: string): Promise<AgentScreenshotLink[]> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getDb();
  const links = await db
    .select()
    .from(assetLinks)
    .where(
      and(
        eq(assetLinks.sourceType, SOURCE_TYPE),
        eq(assetLinks.sourceId, agentId),
        eq(assetLinks.usage, USAGE),
      ),
    )
    .orderBy(asc(assetLinks.orderIndex));
  if (links.length === 0) return [];
  const allAssets = await db.select().from(assets);
  return links.flatMap((l) => {
    const asset = allAssets.find((a) => a.id === l.assetId);
    if (!asset) return [];
    return [
      {
        linkId: l.id,
        assetId: l.assetId,
        url: `/uploads/${asset.storagePath}`,
        caption: l.caption,
        orderIndex: l.orderIndex,
      },
    ];
  });
}

export async function linkAgentScreenshot(
  agentId: string,
  assetId: string,
  caption?: string,
): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getDb();
  const [{ value: maxOrder }] = await db
    .select({ value: max(assetLinks.orderIndex) })
    .from(assetLinks)
    .where(
      and(
        eq(assetLinks.sourceType, SOURCE_TYPE),
        eq(assetLinks.sourceId, agentId),
        eq(assetLinks.usage, USAGE),
      ),
    );
  await db.insert(assetLinks).values({
    assetId,
    sourceType: SOURCE_TYPE,
    sourceId: agentId,
    usage: USAGE,
    caption: caption?.trim() || null,
    orderIndex: (maxOrder ?? -1) + 1,
  });
  await writeAuditLog({
    userId: session.userId,
    action: "create",
    targetType: "asset_link",
    targetId: agentId,
    summary: `绑定 Agent 截图（asset ${assetId.slice(0, 8)}）`,
  });
  revalidatePath("/[locale]");
}

export async function unlinkAgentScreenshot(linkId: string): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getDb();
  await db.delete(assetLinks).where(eq(assetLinks.id, linkId));
  await writeAuditLog({
    userId: session.userId,
    action: "delete",
    targetType: "asset_link",
    targetId: linkId,
    summary: "解绑 Agent 截图",
  });
  revalidatePath("/[locale]");
}

export async function reorderAgentScreenshots(
  agentId: string,
  orderedLinkIds: string[],
): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (orderedLinkIds.length === 0) return;
  const db = await getDb();
  for (let i = 0; i < orderedLinkIds.length; i++) {
    await db
      .update(assetLinks)
      .set({ orderIndex: i })
      .where(
        and(
          eq(assetLinks.id, orderedLinkIds[i]),
          eq(assetLinks.sourceType, SOURCE_TYPE),
          eq(assetLinks.sourceId, agentId),
          eq(assetLinks.usage, USAGE),
        ),
      );
  }
  await writeAuditLog({
    userId: session.userId,
    action: "update",
    targetType: "asset_link",
    targetId: agentId,
    summary: `调整 ${orderedLinkIds.length} 张截图排序`,
  });
  revalidatePath("/[locale]");
}
