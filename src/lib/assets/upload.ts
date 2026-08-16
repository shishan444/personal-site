import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { agents, assetLinks, assets, essays, siteConfig } from "@/lib/db/schema";
import { computeChecksum } from "./checksum";
import { buildStorageLayout, type StorageLayout } from "./storage-path";
import { generateThumbnail, isThumbnailSupported, readImageMetadata } from "./thumbnail";

export interface UploadInput {
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
  uploadedBy: string;
  uploadRoot?: string;
  publicBaseUrl?: string;
}

export interface UploadResult {
  asset: typeof assets.$inferSelect;
  layout: StorageLayout;
  isDuplicate: boolean;
}

export async function persistUpload(input: UploadInput): Promise<UploadResult> {
  const uploadRoot = input.uploadRoot ?? process.env.UPLOAD_DIR ?? "./uploads";
  const publicBaseUrl = input.publicBaseUrl ?? "/uploads";
  const db = await getDb();

  const checksum = computeChecksum(input.buffer);
  const sizeBytes = input.buffer.byteLength;

  const existing = await db.select().from(assets).where(eq(assets.checksum, checksum)).limit(1);
  if (existing.length > 0) {
    return {
      asset: existing[0],
      layout: buildStorageLayout({
        originalFilename: input.originalFilename,
        uploadRoot,
        publicBaseUrl,
      }),
      isDuplicate: true,
    };
  }

  const layout = buildStorageLayout({
    originalFilename: input.originalFilename,
    uploadRoot,
    publicBaseUrl,
  });

  await mkdir(path.dirname(layout.absolutePath), { recursive: true });
  await writeFile(layout.absolutePath, input.buffer);

  let width: number | null = null;
  let height: number | null = null;
  if (isThumbnailSupported(input.mimeType)) {
    const meta = await readImageMetadata(input.buffer);
    width = meta.width ?? null;
    height = meta.height ?? null;

    if (width && height) {
      await mkdir(path.dirname(layout.thumbnailAbsolutePath), { recursive: true });
      const thumbnail = await generateThumbnail(input.buffer);
      await writeFile(layout.thumbnailAbsolutePath, thumbnail);
    }
  }

  const [asset] = await db
    .insert(assets)
    .values({
      filename: layout.filename,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      sizeBytes,
      width: width ?? undefined,
      height: height ?? undefined,
      storagePath: layout.relativePath,
      checksum,
      uploadedBy: input.uploadedBy,
    })
    .returning();

  return { asset, layout, isDuplicate: false };
}

export interface LinkAssetInput {
  assetId: string;
  sourceType: "essay" | "agent" | "timeline_node";
  sourceId: string;
  usage: "inline_image" | "attachment" | "screenshot" | "cover_gallery";
  caption?: string;
  orderIndex?: number;
}

export async function linkAsset(input: LinkAssetInput) {
  const db = await getDb();
  const existing = await db
    .select()
    .from(assetLinks)
    .where(
      and(
        eq(assetLinks.assetId, input.assetId),
        eq(assetLinks.sourceType, input.sourceType),
        eq(assetLinks.sourceId, input.sourceId),
        eq(assetLinks.usage, input.usage),
      ),
    )
    .limit(1);

  if (existing.length > 0) return existing[0];

  const [link] = await db
    .insert(assetLinks)
    .values({
      assetId: input.assetId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      usage: input.usage,
      caption: input.caption,
      orderIndex: input.orderIndex ?? 0,
    })
    .returning();
  return link;
}

export async function unlinkAsset(
  assetId: string,
  sourceType: string,
  sourceId: string,
  usage: string,
): Promise<void> {
  const db = await getDb();
  await db
    .delete(assetLinks)
    .where(
      and(
        eq(assetLinks.assetId, assetId),
        eq(assetLinks.sourceType, sourceType),
        eq(assetLinks.sourceId, sourceId),
        eq(assetLinks.usage, usage),
      ),
    );
}

/** 1:1 强绑定引用：删除前必须检查的字段（DATA-MODEL §8.4 归属纪律）。 */
export interface DirectAssetReference {
  field: string;
  sourceId: string;
  sourceTitle: string;
}

export interface AssetReferences {
  links: Awaited<ReturnType<typeof listAssetLinks>>;
  direct: DirectAssetReference[];
}

async function listAssetLinks(assetId: string) {
  const db = await getDb();
  return db.select().from(assetLinks).where(eq(assetLinks.assetId, assetId));
}

export async function findAssetReferences(assetId: string): Promise<AssetReferences> {
  const db = await getDb();
  const links = await listAssetLinks(assetId);

  const direct: DirectAssetReference[] = [];
  const essayRows = await db
    .select({ id: essays.id, title: essays.title })
    .from(essays)
    .where(eq(essays.ogImageAssetId, assetId));
  for (const row of essayRows) {
    direct.push({ field: "essays.og_image_asset_id", sourceId: row.id, sourceTitle: row.title });
  }
  const agentRows = await db
    .select({ id: agents.id, name: agents.name })
    .from(agents)
    .where(eq(agents.cardImageAssetId, assetId));
  for (const row of agentRows) {
    direct.push({ field: "agents.card_image_asset_id", sourceId: row.id, sourceTitle: row.name });
  }
  const configRows = await db.select().from(siteConfig).where(eq(siteConfig.logoAssetId, assetId));
  for (const row of configRows) {
    direct.push({
      field: "site_config.logo_asset_id",
      sourceId: String(row.id),
      sourceTitle: row.siteName,
    });
  }
  const faviconRows = await db
    .select()
    .from(siteConfig)
    .where(eq(siteConfig.faviconAssetId, assetId));
  for (const row of faviconRows) {
    direct.push({
      field: "site_config.favicon_asset_id",
      sourceId: String(row.id),
      sourceTitle: row.siteName,
    });
  }

  return { links, direct };
}

export interface DeleteAssetResult {
  ok: boolean;
  reason?: "REFERENCED" | "NOT_FOUND";
  references?: AssetReferences;
}

/** 删除到回收站：有任意引用（1:1 或 N:N）拒绝；无引用写 deletedAt（行保留）。 */
export async function deleteAssetIfUnreferenced(assetId: string): Promise<DeleteAssetResult> {
  const db = await getDb();
  const target = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1);
  if (target.length === 0) return { ok: false, reason: "NOT_FOUND" };

  const references = await findAssetReferences(assetId);
  if (references.links.length > 0 || references.direct.length > 0) {
    return { ok: false, reason: "REFERENCED", references };
  }

  await db.update(assets).set({ deletedAt: new Date() }).where(eq(assets.id, assetId));
  return { ok: true };
}

export interface PurgeAssetResult {
  ok: boolean;
  reason?: "NOT_FOUND" | "NOT_IN_TRASH";
}

/** 彻底删除：仅对已在回收站（deletedAt 非空）的资产可行，删除数据库行。 */
export async function purgeAsset(assetId: string): Promise<PurgeAssetResult> {
  const db = await getDb();
  const target = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1);
  if (target.length === 0) return { ok: false, reason: "NOT_FOUND" };
  if (target[0].deletedAt === null) return { ok: false, reason: "NOT_IN_TRASH" };

  await db.delete(assets).where(eq(assets.id, assetId));
  return { ok: true };
}
