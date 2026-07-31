import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import {
  deleteAssetIfUnreferenced,
  findAssetReferences,
  linkAsset,
  persistUpload,
  unlinkAsset,
} from "@/lib/assets";
import { isThumbnailSupported } from "@/lib/assets/thumbnail";
import { getPgliteDb } from "@/lib/db/pglite";
import { assetLinks, assets } from "@/lib/db/schema";

const TMP_ROOT = path.resolve(process.cwd(), ".tmp-uploads-test");
const PUBLIC_BASE = "/uploads";
const OWNER_ID = "00000000-0000-0000-0000-000000000001";
const ESSAY_ID = "e0000001-0000-0000-0000-000000000001";

async function ensureOwner() {
  const db = await getPgliteDb();
  const { users } = await import("@/lib/db/schema");
  const u = await db.select().from(users).where(eq(users.id, OWNER_ID)).limit(1);
  if (u.length > 0) return;
  const { hashPassword } = await import("@/lib/auth/password");
  await db.insert(users).values({
    id: OWNER_ID,
    email: "owner@atelier.com",
    name: "GLM",
    role: "owner",
    passwordHash: await hashPassword("ChangeMe-On-First-Login"),
    mustChangePassword: true,
    emailVerified: true,
  });
}

const JPG_100x80 = Buffer.from(
  "/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCABQAGQDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAYH/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AuwGbrEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//2Q==",
  "base64",
);

describe("L2 · 文件上传 + 资产管理（upload.ts）", () => {
  it("F1 · persistUpload 写入 assets 表 + 保存文件", async () => {
    await ensureOwner();
    const db = await getPgliteDb();
    const before = await db.select().from(assets);

    const result = await persistUpload({
      buffer: JPG_100x80,
      originalFilename: "pixel.jpg",
      mimeType: "image/jpeg",
      uploadedBy: OWNER_ID,
      uploadRoot: TMP_ROOT,
      publicBaseUrl: PUBLIC_BASE,
    });

    expect(result.isDuplicate).toBe(false);
    expect(result.asset.mimeType).toBe("image/jpeg");
    expect(result.asset.sizeBytes).toBe(JPG_100x80.byteLength);
    expect(result.asset.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(existsSync(result.layout.absolutePath)).toBe(true);

    const after = await db.select().from(assets);
    expect(after.length).toBe(before.length + 1);
  });

  it("F1.2 · 图片自动生成缩略图 (_thumbnails/*.webp)", async () => {
    await ensureOwner();
    const uniqueJpg = Buffer.concat([JPG_100x80, Buffer.from(`-${Math.random()}`)]);
    const result = await persistUpload({
      buffer: uniqueJpg,
      originalFilename: "thumb-test.jpg",
      mimeType: "image/jpeg",
      uploadedBy: OWNER_ID,
      uploadRoot: TMP_ROOT,
      publicBaseUrl: PUBLIC_BASE,
    });
    expect(result.isDuplicate).toBe(false);
    expect(existsSync(result.layout.thumbnailAbsolutePath)).toBe(true);
    expect(result.layout.thumbnailRelativePath).toMatch(/\.webp$/);
    expect(result.asset.width).toBe(100);
    expect(result.asset.height).toBe(80);
  });

  it("F2 · 相同内容（同 checksum）触发去重", async () => {
    await ensureOwner();
    const first = await persistUpload({
      buffer: JPG_100x80,
      originalFilename: "first.jpg",
      mimeType: "image/jpeg",
      uploadedBy: OWNER_ID,
      uploadRoot: TMP_ROOT,
      publicBaseUrl: PUBLIC_BASE,
    });
    const second = await persistUpload({
      buffer: JPG_100x80,
      originalFilename: "second-different-name.jpg",
      mimeType: "image/jpeg",
      uploadedBy: OWNER_ID,
      uploadRoot: TMP_ROOT,
      publicBaseUrl: PUBLIC_BASE,
    });

    expect(first.asset.id).toBe(second.asset.id);
    expect(second.isDuplicate).toBe(true);
  });

  it("F3 · 非图片文件不生成缩略图", async () => {
    await ensureOwner();
    const pdfBytes = Buffer.from("%PDF-1.4 ...");
    const result = await persistUpload({
      buffer: pdfBytes,
      originalFilename: "doc.pdf",
      mimeType: "application/pdf",
      uploadedBy: OWNER_ID,
      uploadRoot: TMP_ROOT,
      publicBaseUrl: PUBLIC_BASE,
    });
    expect(existsSync(result.layout.thumbnailAbsolutePath)).toBe(false);
    expect(result.asset.width).toBeNull();
    expect(result.asset.height).toBeNull();
  });

  it("F4 · linkAsset 写入 asset_links 多态关联", async () => {
    await ensureOwner();
    const result = await persistUpload({
      buffer: Buffer.from(`essay-image-${Math.random()}`),
      originalFilename: "essay-inline.png",
      mimeType: "image/jpeg",
      uploadedBy: OWNER_ID,
      uploadRoot: TMP_ROOT,
      publicBaseUrl: PUBLIC_BASE,
    });

    const link = await linkAsset({
      assetId: result.asset.id,
      sourceType: "essay",
      sourceId: ESSAY_ID,
      usage: "inline_image",
    });

    expect(link.assetId).toBe(result.asset.id);
    expect(link.sourceType).toBe("essay");
    expect(link.usage).toBe("inline_image");

    const db = await getPgliteDb();
    const stored = await db.select().from(assetLinks).where(eq(assetLinks.id, link.id)).limit(1);
    expect(stored.length).toBe(1);
  });

  it("F4.2 · 同 source+asset+usage 重复 linkAsset 不创建新行", async () => {
    await ensureOwner();
    const result = await persistUpload({
      buffer: Buffer.from(`dup-link-${Math.random()}`),
      originalFilename: "dup.png",
      mimeType: "image/jpeg",
      uploadedBy: OWNER_ID,
      uploadRoot: TMP_ROOT,
      publicBaseUrl: PUBLIC_BASE,
    });
    const first = await linkAsset({
      assetId: result.asset.id,
      sourceType: "essay",
      sourceId: ESSAY_ID,
      usage: "inline_image",
    });
    const second = await linkAsset({
      assetId: result.asset.id,
      sourceType: "essay",
      sourceId: ESSAY_ID,
      usage: "inline_image",
    });
    expect(first.id).toBe(second.id);
  });

  it("F5 · findAssetReferences 反向查询引用", async () => {
    await ensureOwner();
    const result = await persistUpload({
      buffer: Buffer.from(`ref-${Math.random()}`),
      originalFilename: "ref.png",
      mimeType: "image/jpeg",
      uploadedBy: OWNER_ID,
      uploadRoot: TMP_ROOT,
      publicBaseUrl: PUBLIC_BASE,
    });
    await linkAsset({
      assetId: result.asset.id,
      sourceType: "agent",
      sourceId: "a0000001-0000-0000-0000-000000000001",
      usage: "screenshot",
    });

    const refs = await findAssetReferences(result.asset.id);
    expect(refs.length).toBeGreaterThan(0);
    expect(refs.some((r) => r.usage === "screenshot")).toBe(true);
  });

  it("F6 · unlinkAsset 解除单个关联", async () => {
    await ensureOwner();
    const result = await persistUpload({
      buffer: Buffer.from(`unlink-${Math.random()}`),
      originalFilename: "x.png",
      mimeType: "image/jpeg",
      uploadedBy: OWNER_ID,
      uploadRoot: TMP_ROOT,
      publicBaseUrl: PUBLIC_BASE,
    });
    const link = await linkAsset({
      assetId: result.asset.id,
      sourceType: "timeline_node",
      sourceId: "71000001-0000-0000-0000-000000000005",
      usage: "inline_image",
    });

    await unlinkAsset(
      result.asset.id,
      "timeline_node",
      "71000001-0000-0000-0000-000000000005",
      "inline_image",
    );

    const db = await getPgliteDb();
    const stored = await db.select().from(assetLinks).where(eq(assetLinks.id, link.id));
    expect(stored.length).toBe(0);
  });

  it("F7 · deleteAssetIfUnreferenced 有引用时拒绝删除", async () => {
    await ensureOwner();
    const result = await persistUpload({
      buffer: Buffer.from(`protected-${Math.random()}`),
      originalFilename: "p.png",
      mimeType: "image/jpeg",
      uploadedBy: OWNER_ID,
      uploadRoot: TMP_ROOT,
      publicBaseUrl: PUBLIC_BASE,
    });
    await linkAsset({
      assetId: result.asset.id,
      sourceType: "essay",
      sourceId: ESSAY_ID,
      usage: "inline_image",
    });

    const r = await deleteAssetIfUnreferenced(result.asset.id);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("REFERENCED");
    expect((r.references ?? []).length).toBeGreaterThan(0);
  });

  it("F8 · deleteAssetIfUnreferenced 无引用时成功删除", async () => {
    await ensureOwner();
    const result = await persistUpload({
      buffer: Buffer.from(`deletable-${Math.random()}`),
      originalFilename: "d.png",
      mimeType: "image/jpeg",
      uploadedBy: OWNER_ID,
      uploadRoot: TMP_ROOT,
      publicBaseUrl: PUBLIC_BASE,
    });
    const r = await deleteAssetIfUnreferenced(result.asset.id);
    expect(r.ok).toBe(true);

    const db = await getPgliteDb();
    const stored = await db.select().from(assets).where(eq(assets.id, result.asset.id));
    expect(stored.length).toBe(0);
  });

  it("F9 · deleteAssetIfUnreferenced 不存在的资产返回 NOT_FOUND", async () => {
    const r = await deleteAssetIfUnreferenced("00000000-0000-0000-0000-000000000099");
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("NOT_FOUND");
  });

  it("F10 · isThumbnailSupported 按 mime 判定", () => {
    expect(isThumbnailSupported("image/jpeg")).toBe(true);
    expect(isThumbnailSupported("image/jpeg")).toBe(true);
    expect(isThumbnailSupported("application/pdf")).toBe(false);
    expect(isThumbnailSupported("application/zip")).toBe(false);
  });
});

afterAll(async () => {
  await rm(TMP_ROOT, { recursive: true, force: true });
});
