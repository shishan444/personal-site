"use server";

import { desc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { deleteAssetIfUnreferenced } from "@/lib/assets";
import { getSession } from "@/lib/auth";
import { getPgliteDb } from "@/lib/db/pglite";
import { assets } from "@/lib/db/schema";

export async function softDeleteAsset(id: string): Promise<{ ok: boolean; reason?: string }> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const result = await deleteAssetIfUnreferenced(id);
  if (!result.ok) {
    return { ok: false, reason: result.reason };
  }
  revalidatePath("/[locale]/admin/assets");
  return { ok: true };
}

export async function listAssetsForAdmin() {
  const db = await getPgliteDb();
  const rows = await db.select().from(assets).where(isNull(assets.deletedAt));
  return rows.map((a) => ({
    id: a.id,
    filename: a.filename,
    originalFilename: a.originalFilename,
    mimeType: a.mimeType,
    sizeBytes: a.sizeBytes,
    storagePath: a.storagePath,
    publicUrl: `/uploads/${a.storagePath}`,
    width: a.width,
    height: a.height,
    createdAt: a.createdAt,
  }));
}

export async function listAuditLogsForAdmin(opts?: { action?: string; limit?: number }) {
  const db = await getPgliteDb();
  const { auditLogs } = await import("@/lib/db/schema");
  const limit = opts?.limit ?? 50;
  const baseQuery =
    opts?.action != null
      ? db
          .select()
          .from(auditLogs)
          .where(eq(auditLogs.action, opts.action as never))
      : db.select().from(auditLogs);
  const rows = await baseQuery.orderBy(desc(auditLogs.createdAt)).limit(limit);
  return rows.map((log) => ({
    id: log.id,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    summary: log.summary,
    createdAt: log.createdAt,
  }));
}
