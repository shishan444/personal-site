import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAgent, reorderAgents } from "@/lib/actions/agents";
import { createTimelineNode, setAsNow } from "@/lib/actions/timeline";
import { getPgliteDb } from "@/lib/db/pglite";
import { agents, timelineNodes } from "@/lib/db/schema";

const UNIQUE_RUN = String(Date.now() % 100000);

const SESSION_TOKEN = "integration-agents-token";

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
  const { sessions, users } = await import("@/lib/db/schema");
  const { hashPassword } = await import("@/lib/auth/password");
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

  await db.delete(agents);
  await db.delete(timelineNodes);
});

afterEach(async () => {
  const db = await getPgliteDb();
  await db.delete(agents);
  await db.delete(timelineNodes);
});

describe("L2 · agents reorder 两阶段避 agents_order_idx 唯一索引", () => {
  it("F1 · 三个 Agent 反向排序最终 order=1..n 且无残留 4..6", async () => {
    const a = await createAgent({
      sn: `A-R1-${UNIQUE_RUN}`,
      name: "A",
      desc: "x",
      status: "active",
      specs: [],
      clickTarget: "internal",
      launchType: "external",
    });
    const b = await createAgent({
      sn: `A-R2-${UNIQUE_RUN}`,
      name: "B",
      desc: "x",
      status: "active",
      specs: [],
      clickTarget: "internal",
      launchType: "external",
    });
    const c = await createAgent({
      sn: `A-R3-${UNIQUE_RUN}`,
      name: "C",
      desc: "x",
      status: "active",
      specs: [],
      clickTarget: "internal",
      launchType: "external",
    });

    await reorderAgents([c.id, b.id, a.id]);

    const db = await getPgliteDb();
    const rows = await db.select().from(agents);
    const byOrder = rows.sort((x, y) => x.order - y.order);
    expect(byOrder.map((r) => r.order)).toEqual([1, 2, 3]);
    expect(byOrder.map((r) => r.sn)).toEqual([
      `A-R3-${UNIQUE_RUN}`,
      `A-R2-${UNIQUE_RUN}`,
      `A-R1-${UNIQUE_RUN}`,
    ]);
  });

  it("F2 · 两个 Agent 交换顺序（最小 reorder）", async () => {
    const a = await createAgent({
      sn: `A-X1-${UNIQUE_RUN}`,
      name: "A",
      desc: "x",
      status: "active",
      specs: [],
      clickTarget: "internal",
      launchType: "external",
    });
    const b = await createAgent({
      sn: `A-X2-${UNIQUE_RUN}`,
      name: "B",
      desc: "x",
      status: "active",
      specs: [],
      clickTarget: "internal",
      launchType: "external",
    });
    await reorderAgents([b.id, a.id]);
    const db = await getPgliteDb();
    const rows = await db.select().from(agents);
    const aRow = rows.find((r) => r.id === a.id);
    const bRow = rows.find((r) => r.id === b.id);
    expect(aRow?.order).toBe(2);
    expect(bRow?.order).toBe(1);
  });
});

describe("L2 · agents SN 唯一性（agents_sn_idx）", () => {
  it("F3 · 同 SN 第二次插入应被 DB 拒绝", async () => {
    const SN = `A-DUP-${UNIQUE_RUN}`;
    await createAgent({
      sn: SN,
      name: "n1",
      desc: "x",
      status: "active",
      specs: [],
      clickTarget: "internal",
      launchType: "external",
    });
    await expect(
      createAgent({
        sn: SN,
        name: "n2",
        desc: "x",
        status: "active",
        specs: [],
        clickTarget: "internal",
        launchType: "external",
      }),
    ).rejects.toThrow();
  });
});

describe("L2 · timeline_one_now_idx 部分唯一索引兜底", () => {
  it("F4 · setAsNow 取消其他 NOW 节点（应用层 + DB 兜底）", async () => {
    const first = await createTimelineNode({
      version: `v0.T1-${UNIQUE_RUN}`,
      name: "n1",
      desc: "d",
      type: "now",
      date: "2026-08-01",
      changes: [],
      filesChanged: null,
      linesAdd: null,
      linesDel: null,
      isNow: true,
    });
    const second = await createTimelineNode({
      version: `v0.T2-${UNIQUE_RUN}`,
      name: "n2",
      desc: "d",
      type: "normal",
      date: "2026-08-02",
      changes: [],
      filesChanged: null,
      linesAdd: null,
      linesDel: null,
      isNow: false,
    });

    await setAsNow(second.id);

    const db = await getPgliteDb();
    const rows = await db.select().from(timelineNodes);
    const firstRow = rows.find((r) => r.id === first.id);
    const secondRow = rows.find((r) => r.id === second.id);
    expect(firstRow?.isNow).toBe(false);
    expect(secondRow?.isNow).toBe(true);
    expect(secondRow?.type).toBe("now");
    const nowCount = rows.filter((r) => r.isNow).length;
    expect(nowCount).toBe(1);
  });

  it("F5 · 直接 INSERT 第二个 isNow=true 应被 DB 拒绝（timeline_one_now_idx 兜底）", async () => {
    const db = await getPgliteDb();
    await db.insert(timelineNodes).values({
      version: `v0.D1-${UNIQUE_RUN}`,
      name: "n1",
      desc: "d",
      type: "now",
      date: "2026-08-01",
      isNow: true,
    });
    await expect(
      db.insert(timelineNodes).values({
        version: `v0.D2-${UNIQUE_RUN}`,
        name: "n2",
        desc: "d",
        type: "now",
        date: "2026-08-02",
        isNow: true,
      }),
    ).rejects.toThrow();
  });
});
