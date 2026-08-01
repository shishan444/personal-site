"use server";

import { isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { deleteAssetIfUnreferenced } from "@/lib/assets";
import { writeAuditLog } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { assets } from "@/lib/db/schema";

export async function softDeleteAsset(id: string): Promise<{ ok: boolean; reason?: string }> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const result = await deleteAssetIfUnreferenced(id);
  if (!result.ok) {
    return { ok: false, reason: result.reason };
  }
  await writeAuditLog({
    userId: session.userId,
    action: "delete",
    targetType: "asset",
    targetId: id,
    summary: "删除资产",
  });
  revalidatePath("/[locale]/admin/assets");
  return { ok: true };
}

export async function listAssetsForAdmin() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getDb();
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
