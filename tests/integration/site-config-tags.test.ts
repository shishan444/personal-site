import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { updateSiteConfig } from "@/lib/actions/site-config";
import { mergeTopicTag } from "@/lib/actions/tags";
import { hashPassword } from "@/lib/auth/password";
import { getPgliteDb } from "@/lib/db/pglite";
import { essays, siteConfig, users } from "@/lib/db/schema";

const UNIQUE_RUN = String(Date.now() % 100000);
const SESSION_TOKEN = "integration-config-tags-token";

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

beforeEach(async () => {
  cookieStore = {};
  const db = await getPgliteDb();
  const { sessions } = await import("@/lib/db/schema");
  const u = (
    await db
      .select()
      .from(users)
      .where(eq(users.id, "00000000-0000-0000-0000-000000000001"))
      .limit(1)
  )[0];
  if (!u) {
    await db.insert(users).values({
      id: "00000000-0000-0000-0000-000000000001",
      email: "owner@atelier.com",
      name: "GLM",
      role: "owner",
      passwordHash: await hashPassword("x"),
      emailVerified: true,
    });
  }
  await db.delete(sessions).where(eq(sessions.token, SESSION_TOKEN));
  await db.insert(sessions).values({
    userId: "00000000-0000-0000-0000-000000000001",
    token: SESSION_TOKEN,
    expiresAt: new Date(Date.now() + 60_000),
  });
  cookieStore.atelier_session = SESSION_TOKEN;
});

afterEach(async () => {
  const db = await getPgliteDb();
  await db.delete(essays);
});

describe("L2 · mergeTopicTag 多文章替换 + 去重", () => {
  it("F1 · 替换 src → dst 在多文章中（含去重）", async () => {
    const db = await getPgliteDb();
    await db.insert(essays).values([
      {
        sn: `SN-T1-${UNIQUE_RUN}`,
        lang: "zh",
        title: "t1",
        deck: "d",
        body: "b",
        typeTag: "essay",
        topicTags: ["ai", "essay"],
        status: "draft",
        authorId: "00000000-0000-0000-0000-000000000001",
        translationGroupId: crypto.randomUUID(),
      },
      {
        sn: `SN-T2-${UNIQUE_RUN}`,
        lang: "zh",
        title: "t2",
        deck: "d",
        body: "b",
        typeTag: "essay",
        topicTags: ["ai", "note"],
        status: "draft",
        authorId: "00000000-0000-0000-0000-000000000001",
        translationGroupId: crypto.randomUUID(),
      },
      {
        sn: `SN-T3-${UNIQUE_RUN}`,
        lang: "zh",
        title: "t3",
        deck: "d",
        body: "b",
        typeTag: "essay",
        topicTags: ["other"],
        status: "draft",
        authorId: "00000000-0000-0000-0000-000000000001",
        translationGroupId: crypto.randomUUID(),
      },
    ]);

    const result = await mergeTopicTag("ai", "ml");
    expect(result.affected).toBe(2);

    const rows = await db.select().from(essays);
    const t1 = rows.find((r) => r.sn === `SN-T1-${UNIQUE_RUN}`);
    const t2 = rows.find((r) => r.sn === `SN-T2-${UNIQUE_RUN}`);
    const t3 = rows.find((r) => r.sn === `SN-T3-${UNIQUE_RUN}`);
    expect(t1?.topicTags).toEqual(["ml", "essay"]);
    expect(t2?.topicTags).toEqual(["ml", "note"]);
    expect(t3?.topicTags).toEqual(["other"]);
  });

  it("F2 · 已存在 dst 时去重避免 ['dst','dst']", async () => {
    const db = await getPgliteDb();
    await db.insert(essays).values({
      sn: `SN-D1-${UNIQUE_RUN}`,
      lang: "zh",
      title: "d1",
      deck: "d",
      body: "b",
      typeTag: "essay",
      topicTags: ["ai", "ml"],
      status: "draft",
      authorId: "00000000-0000-0000-0000-000000000001",
      translationGroupId: crypto.randomUUID(),
    });
    await mergeTopicTag("ai", "ml");
    const rows = await db.select().from(essays);
    const row = rows.find((r) => r.sn === `SN-D1-${UNIQUE_RUN}`);
    expect(row?.topicTags).toEqual(["ml"]);
  });

  it("F3 · 同名 tag 返回 0（无操作）", async () => {
    const result = await mergeTopicTag("same", "same");
    expect(result.affected).toBe(0);
  });

  it("F4 · 空白 src/dst 抛 INVALID_INPUT", async () => {
    await expect(mergeTopicTag("", "x")).rejects.toThrow(/INVALID_INPUT/);
    await expect(mergeTopicTag("x", "  ")).rejects.toThrow(/INVALID_INPUT/);
  });
});

describe("L2 · site-config 更新 + 单行约束", () => {
  it("F5 · updateSiteConfig 写入字段 + 持久化", async () => {
    const db = await getPgliteDb();
    await db.delete(siteConfig);
    await db.insert(siteConfig).values({
      id: 1,
      siteName: "Atelier",
      subtitle: "s",
      currentVersion: "v0.4",
      currentCalibre: "04",
      heroSub: "h",
      rdMeta1: "m1",
      rdMeta2: "m2",
      subdialsConfig: {
        lu: { enabled: true },
        ru: { enabled: true, tickCount: 5 },
        ld: { enabled: true },
        rd: { enabled: true, meta1: "v0.4", meta2: "NEXT" },
      },
      chaptersConfig: [],
      globalStats: { inService: "x", inBeta: "y", writing: "z", calibre: "05" },
      theme: "warm-amber",
    });

    await updateSiteConfig({
      siteName: "New Atelier",
      currentVersion: "v0.5",
      currentCalibre: "05",
      theme: "cyan-mono",
    });

    const row = (await db.select().from(siteConfig).where(eq(siteConfig.id, 1)).limit(1))[0];
    expect(row?.siteName).toBe("New Atelier");
    expect(row?.currentVersion).toBe("v0.5");
    expect(row?.currentCalibre).toBe("05");
    expect(row?.theme).toBe("cyan-mono");
  });
});
