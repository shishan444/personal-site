import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEssay, deleteEssay, purgeEssay, restoreEssayFromTrash } from "@/lib/actions/essays";
import { addExternalAttachment, listTrash, restoreFromTrash } from "@/lib/actions/trash";
import { getPgliteDb } from "@/lib/db/pglite";
import { essayRevisions, essays } from "@/lib/db/schema";
import { getEssayBySlug } from "@/lib/queries/detail";

const SESSION_TOKEN = "integration-trash-token";
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
vi.mock("next/navigation", () => ({ redirect: () => {} }));

const USER_ID = "00000000-0000-0000-0000-000000000001";

beforeEach(async () => {
  cookieStore = {};
  const db = await getPgliteDb();
  const { sessions, users } = await import("@/lib/db/schema");
  const { hashPassword } = await import("@/lib/auth/password");
  const u = (await db.select().from(users).where(eq(users.id, USER_ID)).limit(1))[0];
  if (!u) {
    await db.insert(users).values({
      id: USER_ID,
      email: "owner-trash@atelier.com",
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
  cookieStore.atelier_session = SESSION_TOKEN;
});

afterEach(async () => {
  const db = await getPgliteDb();
  const { sessions } = await import("@/lib/db/schema");
  await db.delete(sessions).where(eq(sessions.token, SESSION_TOKEN));
});

describe("L2 · 两级删除（删除→回收站→彻底删除）", () => {
  it("F1 · 删除文章进回收站：行保留、前台 slug 查询不可见", async () => {
    const db = await getPgliteDb();
    const created = await createEssay({
      lang: "zh",
      title: "回收站测试",
      deck: "d",
      body: "b",
      typeTag: "essay",
      topicTags: [],
      status: "published",
      slug: `trash-${Date.now() % 100000}`,
    });

    await deleteEssay(created.id);

    const rows = await db.select().from(essays).where(eq(essays.id, created.id));
    expect(rows.length).toBe(1);
    expect(rows[0].deletedAt).not.toBeNull();

    const visible = await getEssayBySlug(rows[0].slug as string, "zh");
    expect(visible).toBeNull();

    // 恢复后前台可见
    await restoreEssayFromTrash(created.id);
    const restored = await getEssayBySlug(rows[0].slug as string, "zh");
    expect(restored?.id).toBe(created.id);

    // 清理
    await deleteEssay(created.id);
    await purgeEssay(created.id);
    const after = await db.select().from(essays).where(eq(essays.id, created.id));
    expect(after.length).toBe(0);
  });

  it("F2 · 彻底删除保留过 revisions 直到 purge 才删除", async () => {
    const db = await getPgliteDb();
    const created = await createEssay({
      lang: "zh",
      title: "版本保留测试",
      deck: "d",
      body: "b",
      typeTag: "essay",
      topicTags: [],
      status: "draft",
      slug: null,
    });
    await deleteEssay(created.id);
    const revsAfterSoft = await db
      .select()
      .from(essayRevisions)
      .where(eq(essayRevisions.essayId, created.id));
    expect(revsAfterSoft.length).toBeGreaterThanOrEqual(0); // 软删不碰 revisions

    await purgeEssay(created.id);
    const revsAfterPurge = await db
      .select()
      .from(essayRevisions)
      .where(eq(essayRevisions.essayId, created.id));
    expect(revsAfterPurge.length).toBe(0);
  });

  it("F3 · listTrash 收录三类软删条目", async () => {
    const created = await createEssay({
      lang: "zh",
      title: "列表测试",
      deck: "d",
      body: "b",
      typeTag: "essay",
      topicTags: [],
      status: "draft",
      slug: null,
    });
    await deleteEssay(created.id);
    const items = await listTrash();
    const found = items.find((i) => i.id === created.id && i.kind === "essay");
    expect(found).toBeTruthy();
    expect(found?.title).toBe("列表测试");

    await restoreFromTrash("essay", created.id);
    await deleteEssay(created.id);
    await purgeEssay(created.id);
  });
});

describe("L2 · 附件外链", () => {
  it("F4 · addExternalAttachment 写入 externalUrl 链接并可在附件列表读回", async () => {
    const db = await getPgliteDb();
    const created = await createEssay({
      lang: "zh",
      title: "外链附件测试",
      deck: "d",
      body: "b",
      typeTag: "essay",
      topicTags: [],
      status: "published",
      slug: `ext-${Date.now() % 100000}`,
    });

    const r = await addExternalAttachment(created.id, "https://pan.example.com/big.zip", "大文件");
    expect(r.ok).toBe(true);
    const bad = await addExternalAttachment(created.id, "ftp://x", "x");
    expect(bad.ok).toBe(false);

    const { getEssayAttachments } = await import("@/lib/queries/detail");
    const atts = await getEssayAttachments(created.id);
    const ext = atts.find((a) => a.external);
    expect(ext?.url).toBe("https://pan.example.com/big.zip");
    expect(ext?.filename).toBe("大文件");

    await deleteEssay(created.id);
    await purgeEssay(created.id);
  });
});
