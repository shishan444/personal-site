import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAgent } from "@/lib/actions/agents";
import { createEssay } from "@/lib/actions/essays";
import { getPgliteDb } from "@/lib/db/pglite";
import { agents, essays } from "@/lib/db/schema";
import { nextSequenceSn } from "@/lib/utils/sn";

const SESSION_TOKEN = "integration-sn-token";
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
      email: "owner-sn@atelier.com",
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

describe("L2 · SN 顺序生成（max+1）", () => {
  it("F1 · 留空 SN 创建文章：服务端生成且连续创建递增", async () => {
    const a = await createEssay({
      lang: "zh",
      title: "SN 测试 A",
      deck: "d",
      body: "b",
      typeTag: "essay",
      topicTags: [],
      status: "draft",
      slug: null,
    });
    const b = await createEssay({
      lang: "zh",
      title: "SN 测试 B",
      deck: "d",
      body: "b",
      typeTag: "essay",
      topicTags: [],
      status: "draft",
      slug: null,
    });
    expect(a.sn).toMatch(/^SN-\d+$/);
    expect(b.sn).not.toBe(a.sn);

    const numA = Number.parseInt(a.sn.replace("SN-", ""), 10);
    const numB = Number.parseInt(b.sn.replace("SN-", ""), 10);
    expect(numB).toBe(numA + 1);

    const db = await getPgliteDb();
    await db.delete(essays).where(eq(essays.id, a.id));
    await db.delete(essays).where(eq(essays.id, b.id));
  });

  it("F2 · 留空 SN 创建 Agent：CAL.A- 前缀递增", async () => {
    const a = await createAgent({
      name: "SN Agent A",
      desc: "d",
      status: "active",
      launchUrl: "https://example.com",
      clickTarget: "internal" as const,
      launchType: "external" as const,
      specs: [],
    });
    expect(a.sn).toMatch(/^CAL\.A-\d+$/);
    const db = await getPgliteDb();
    await db.delete(agents).where(eq(agents.id, a.id));
  });

  it("F3 · nextSequenceSn 沿用现有最大位宽", async () => {
    const sn = await nextSequenceSn("essays", "SN-");
    expect(sn).toMatch(/^SN-\d{3,}$/);
  });
});
