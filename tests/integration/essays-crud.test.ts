import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEssay, deleteEssay, publishEssay } from "@/lib/actions/essays";
import { hashPassword } from "@/lib/auth/password";
import { getPgliteDb } from "@/lib/db/pglite";
import { essayRevisions, essays, users } from "@/lib/db/schema";

const OWNER_ID = "00000000-0000-0000-0000-000000000001";
const SESSION_TOKEN = "integration-test-token";

const UNIQUE_RUN = String(Date.now() % 100000);

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
  await db.delete(essayRevisions);
  await db.delete(essays);
  const u = (await db.select().from(users).where(eq(users.id, OWNER_ID)).limit(1))[0];
  if (!u) {
    await db.insert(users).values({
      id: OWNER_ID,
      email: "owner@atelier.com",
      name: "GLM",
      role: "owner",
      passwordHash: await hashPassword("x"),
      emailVerified: true,
    });
  }
});

afterEach(async () => {
  const db = await getPgliteDb();
  await db.delete(essayRevisions);
  await db.delete(essays);
});

async function seedSession(): Promise<void> {
  const db = await getPgliteDb();
  const { sessions } = await import("@/lib/db/schema");
  await db.delete(sessions).where(eq(sessions.token, SESSION_TOKEN));
  await db.insert(sessions).values({
    userId: OWNER_ID,
    token: SESSION_TOKEN,
    expiresAt: new Date(Date.now() + 60_000),
  });
  cookieStore.atelier_session = SESSION_TOKEN;
}

describe("L2 · essays CRUD 全状态机（真实 PGlite）", () => {
  it("F1 · createEssay 写入 essays 表 + revision(created) + audit", async () => {
    await seedSession();
    const result = await createEssay({
      sn: `SN-CR-${UNIQUE_RUN}`,
      lang: "zh",
      title: "测试",
      deck: "d",
      body: "正文内容",
      typeTag: "essay",
      topicTags: ["ai", "test"],
      status: "draft",
      slug: `crud-${UNIQUE_RUN}`,
    });
    expect(result.id).toBeDefined();

    const db = await getPgliteDb();
    const revisions = await db
      .select()
      .from(essayRevisions)
      .where(eq(essayRevisions.essayId, result.id));
    expect(revisions.length).toBe(1);
    expect(revisions[0]?.action).toBe("created");
  });

  it("F2 · createEssay status=published 时 publishedAt 自动写入", async () => {
    await seedSession();
    const result = await createEssay({
      sn: `SN-PB-${UNIQUE_RUN}`,
      lang: "zh",
      title: "已发布",
      deck: "d",
      body: "b",
      typeTag: "essay",
      topicTags: [],
      status: "published",
      slug: `pb-${UNIQUE_RUN}`,
    });
    const db = await getPgliteDb();
    const row = (await db.select().from(essays).where(eq(essays.id, result.id)).limit(1))[0];
    expect(row?.status).toBe("published");
    expect(row?.publishedAt).toBeInstanceOf(Date);
  });

  it("F3 · updateEssay 状态变化写 revision(published)", async () => {
    await seedSession();
    const result = await createEssay({
      sn: `SN-U1-${UNIQUE_RUN}`,
      lang: "zh",
      title: "草稿",
      deck: "d",
      body: "b",
      typeTag: "essay",
      topicTags: [],
      status: "draft",
      slug: `u1-${UNIQUE_RUN}`,
    });
    await publishEssay(result.id);
    const db = await getPgliteDb();
    const revisions = await db
      .select()
      .from(essayRevisions)
      .where(eq(essayRevisions.essayId, result.id));
    expect(revisions.length).toBe(2);
    expect(revisions[1]?.action).toBe("published");
  });

  it("F4 · deleteEssay 软删除（回收站语义：行与 revisions 保留，purge 才清）", async () => {
    await seedSession();
    const result = await createEssay({
      lang: "zh",
      title: "待删",
      deck: "d",
      body: "b",
      typeTag: "essay",
      topicTags: [],
      status: "draft",
      slug: `dl-${UNIQUE_RUN}`,
    });
    const db = await getPgliteDb();
    const revisionsBefore = await db
      .select()
      .from(essayRevisions)
      .where(eq(essayRevisions.essayId, result.id));
    expect(revisionsBefore.length).toBe(1);

    await deleteEssay(result.id);

    const essay = (await db.select().from(essays).where(eq(essays.id, result.id)).limit(1))[0];
    expect(essay).toBeDefined();
    expect(essay?.deletedAt).not.toBeNull();
    const revisionsAfter = await db
      .select()
      .from(essayRevisions)
      .where(eq(essayRevisions.essayId, result.id));
    expect(revisionsAfter.length).toBe(1);

    const { purgeEssay } = await import("@/lib/actions/essays");
    await purgeEssay(result.id);
    const purged = (await db.select().from(essays).where(eq(essays.id, result.id)).limit(1))[0];
    expect(purged).toBeUndefined();
    const revisionsPurged = await db
      .select()
      .from(essayRevisions)
      .where(eq(essayRevisions.essayId, result.id));
    expect(revisionsPurged.length).toBe(0);
  });
});

describe("L2 · essays SN 唯一性（essays_sn_idx）", () => {
  it("F5 · 同 SN 第二次插入应被 DB 拒绝（抛错）", async () => {
    await seedSession();
    const SN = `SN-DUP-${UNIQUE_RUN}`;
    await createEssay({
      sn: SN,
      lang: "zh",
      title: "first",
      deck: "d",
      body: "b",
      typeTag: "essay",
      topicTags: [],
      status: "draft",
      slug: `dup-1-${UNIQUE_RUN}`,
    });
    await expect(
      createEssay({
        sn: SN,
        lang: "zh",
        title: "second",
        deck: "d",
        body: "b",
        typeTag: "essay",
        topicTags: [],
        status: "draft",
        slug: `dup-2-${UNIQUE_RUN}`,
      }),
    ).rejects.toThrow();
  });
});

describe("L2 · essays Slug 部分唯一索引（essays_slug_idx where slug IS NOT NULL）", () => {
  it("F6 · 同 slug 第二次插入应被 DB 拒绝", async () => {
    await seedSession();
    const SLUG = `same-slug-${UNIQUE_RUN}`;
    await createEssay({
      sn: `SN-S1-${UNIQUE_RUN}`,
      lang: "zh",
      title: "first",
      deck: "d",
      body: "b",
      typeTag: "essay",
      topicTags: [],
      status: "draft",
      slug: SLUG,
    });
    await expect(
      createEssay({
        sn: `SN-S2-${UNIQUE_RUN}`,
        lang: "zh",
        title: "second",
        deck: "d",
        body: "b",
        typeTag: "essay",
        topicTags: [],
        status: "draft",
        slug: SLUG,
      }),
    ).rejects.toThrow();
  });

  it("F7 · slug=NULL 多行允许（部分唯一索引 NULL 不冲突）", async () => {
    await seedSession();
    await createEssay({
      sn: `SN-N1-${UNIQUE_RUN}`,
      lang: "zh",
      title: "n1",
      deck: "d",
      body: "b",
      typeTag: "essay",
      topicTags: [],
      status: "draft",
      slug: null,
    });
    await expect(
      createEssay({
        sn: `SN-N2-${UNIQUE_RUN}`,
        lang: "zh",
        title: "n2",
        deck: "d",
        body: "b",
        typeTag: "essay",
        topicTags: [],
        status: "draft",
        slug: null,
      }),
    ).resolves.toMatchObject({ sn: `SN-N2-${UNIQUE_RUN}` });
  });
});

describe("L2 · essays 未登录拒绝", () => {
  it("F8 · createEssay 无 session 抛 UNAUTHORIZED", async () => {
    cookieStore = {};
    await expect(
      createEssay({
        sn: `SN-NO-${UNIQUE_RUN}`,
        lang: "zh",
        title: "x",
        deck: "d",
        body: "b",
        typeTag: "essay",
        topicTags: [],
        status: "draft",
        slug: `no-${UNIQUE_RUN}`,
      }),
    ).rejects.toThrow(/UNAUTHORIZED/);
  });
});
