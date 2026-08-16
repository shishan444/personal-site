import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteAssetIfUnreferenced, findAssetReferences, purgeAsset } from "@/lib/assets";
import { getPgliteDb } from "@/lib/db/pglite";
import { assets, essays } from "@/lib/db/schema";

const SESSION_TOKEN = "integration-assets-token";

let cookieStore: Record<string, string> = {};

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => (cookieStore[name] ? { value: cookieStore[name] } : undefined),
    set: (name: string, value: string) => {
      cookieStore[name] = value;
    },
    delete: (name: string) => {
      delete cookieStore[name];
    },
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const USER_ID = "00000000-0000-0000-0000-000000000001";

async function insertFixtureAsset(filename: string) {
  const db = await getPgliteDb();
  const [asset] = await db
    .insert(assets)
    .values({
      filename,
      originalFilename: filename,
      mimeType: "image/png",
      sizeBytes: 1024,
      storagePath: `2026/08/${filename}`,
      checksum: `ck-${filename}-${Date.now()}`,
      uploadedBy: USER_ID,
    })
    .returning();
  return asset;
}

beforeEach(async () => {
  cookieStore = {};
  const db = await getPgliteDb();
  const { sessions, users } = await import("@/lib/db/schema");
  const { hashPassword } = await import("@/lib/auth/password");
  const u = (await db.select().from(users).where(eq(users.id, USER_ID)).limit(1))[0];
  if (!u) {
    await db.insert(users).values({
      id: USER_ID,
      email: "owner-assets@atelier.com",
      name: "GLM",
      role: "owner",
      passwordHash: await hashPassword("x"),
      emailVerified: true,
    });
  }
  await db.delete(sessions).where(eq(sessions.token, SESSION_TOKEN));
  await db.insert(sessions).values({
    token: SESSION_TOKEN,
    userId: USER_ID,
    expiresAt: new Date(Date.now() + 3600_000),
  });
  cookieStore.session = SESSION_TOKEN;
});

afterEach(async () => {
  const db = await getPgliteDb();
  const { sessions } = await import("@/lib/db/schema");
  await db.delete(sessions).where(eq(sessions.token, SESSION_TOKEN));
});

describe("L2 · 资产归属约束（1:1 引用检查）", () => {
  it("F1 · 被文章 OG 图引用的资产删除被拒，且 direct 引用可见来源", async () => {
    const db = await getPgliteDb();
    const asset = await insertFixtureAsset("og-ref.png");
    await db.insert(essays).values({
      sn: `SN-OG${Date.now() % 100000}`,
      lang: "zh",
      translationGroupId: asset.id,
      title: "引用测试文章",
      deck: "d",
      body: "b",
      typeTag: "essay",
      ogImageAssetId: asset.id,
      authorId: USER_ID,
    });

    const result = await deleteAssetIfUnreferenced(asset.id);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("REFERENCED");

    const refs = await findAssetReferences(asset.id);
    expect(refs.direct.length).toBeGreaterThan(0);
    const ogRef = refs.direct.find((r) => r.field === "essays.og_image_asset_id");
    expect(ogRef).toBeTruthy();
    expect(ogRef?.sourceTitle).toContain("引用测试文章");

    // 行未被删除
    const rows = await db.select().from(assets).where(eq(assets.id, asset.id));
    expect(rows.length).toBe(1);
    await db.delete(essays).where(eq(essays.ogImageAssetId, asset.id));
  });

  it("F2 · 被 Agent 卡片图/站点 Logo 引用的资产删除被拒", async () => {
    const db = await getPgliteDb();
    const { agents, siteConfig } = await import("@/lib/db/schema");
    const asset = await insertFixtureAsset("card-ref.png");
    await db.insert(agents).values({
      sn: `CAL.A-${(Date.now() % 900) + 99}`,
      name: "Ref Agent",
      desc: "d",
      status: "active",
      launchUrl: "https://example.com",
      order: 1,
      cardImageAssetId: asset.id,
    });
    let result = await deleteAssetIfUnreferenced(asset.id);
    expect(result.ok).toBe(false);

    const logoAsset = await insertFixtureAsset("logo-ref.png");
    await db.delete(siteConfig);
    await db.insert(siteConfig).values({
      id: 1,
      siteName: "t",
      subtitle: "s",
      heroSub: "h",
      rdMeta1: "m1",
      rdMeta2: "m2",
      subdialsConfig: {
        lu: { enabled: true },
        ru: { enabled: true, tickCount: 5 },
        ld: { enabled: true },
        rd: { enabled: true, meta1: "a", meta2: "b" },
      },
      chaptersConfig: [],
      globalStats: { inService: "1", inBeta: "1", writing: "1", calibre: "04" },
      logoAssetId: logoAsset.id,
    });
    result = await deleteAssetIfUnreferenced(logoAsset.id);
    expect(result.ok).toBe(false);
  });
});

describe("L2 · 资产两级删除（软删除→回收站→彻底删除）", () => {
  it("F3 · 无引用资产删除 = 软删除（deletedAt 写入，行保留）", async () => {
    const db = await getPgliteDb();
    const asset = await insertFixtureAsset("soft-del.png");

    const result = await deleteAssetIfUnreferenced(asset.id);
    expect(result.ok).toBe(true);

    const rows = await db.select().from(assets).where(eq(assets.id, asset.id));
    expect(rows.length).toBe(1);
    expect(rows[0].deletedAt).not.toBeNull();
  });

  it("F4 · purgeAsset 彻底删除仅对回收站内资产可行", async () => {
    const db = await getPgliteDb();
    const asset = await insertFixtureAsset("purge.png");

    // 未软删时拒绝彻底删除
    const early = await purgeAsset(asset.id);
    expect(early.ok).toBe(false);
    expect(early.reason).toBe("NOT_IN_TRASH");

    // 软删后彻底删除成功
    await deleteAssetIfUnreferenced(asset.id);
    const purged = await purgeAsset(asset.id);
    expect(purged.ok).toBe(true);
    const rows = await db.select().from(assets).where(eq(assets.id, asset.id));
    expect(rows.length).toBe(0);
  });
});
