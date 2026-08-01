"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { essays } from "@/lib/db/schema";

export async function mergeTopicTag(from: string, to: string): Promise<{ affected: number }> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const src = from.trim();
  const dst = to.trim();
  if (!src || !dst) throw new Error("INVALID_INPUT");
  if (src === dst) return { affected: 0 };

  const db = await getDb();
  const all = await db.select().from(essays);
  let affected = 0;
  for (const essay of all) {
    if (!essay.topicTags.includes(src)) continue;
    const deduped = Array.from(new Set(essay.topicTags.map((t) => (t === src ? dst : t))));
    await db.update(essays).set({ topicTags: deduped }).where(eq(essays.id, essay.id));
    affected += 1;
  }

  await writeAuditLog({
    userId: session.userId,
    action: "update",
    targetType: "tag",
    summary: `合并标签 ${src} → ${dst}（${affected} 篇）`,
  });
  revalidatePath("/[locale]");
  return { affected };
}
