import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { hashPassword } from "@/lib/auth/password";
import { getPgliteDb } from "@/lib/db/pglite";
import { agents, essays, users } from "@/lib/db/schema";
import { getAdminDashboard } from "@/lib/queries/admin";

const OWNER_ID = "00000000-0000-0000-0000-000000000001";

async function ensureData() {
  const db = await getPgliteDb();
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
  const existingAgents = await db.select().from(agents);
  if (existingAgents.length === 0) {
    await db.insert(agents).values([
      {
        sn: "CAL.X-01",
        name: "Test 1",
        desc: "desc",
        status: "active",
        specs: [],
        order: 1,
      },
      {
        sn: "CAL.X-02",
        name: "Test 2",
        desc: "desc",
        status: "coming",
        specs: [],
        order: 2,
      },
      {
        sn: "CAL.X-03",
        name: "Test 3 (no desc)",
        desc: "",
        status: "active",
        specs: [],
        order: 3,
      },
    ]);
  }
  const existingEssays = await db.select().from(essays);
  if (existingEssays.length === 0) {
    await db.insert(essays).values([
      {
        sn: "SN-DRAFT",
        lang: "zh",
        title: "Draft Essay",
        deck: "deck",
        body: "body",
        typeTag: "essay",
        status: "draft",
        translationGroupId: "00000000-0000-0000-0000-000000000010",
        authorId: OWNER_ID,
      },
      {
        sn: "SN-PUB",
        lang: "zh",
        title: "Published Essay",
        deck: "deck",
        body: "body",
        typeTag: "essay",
        status: "published",
        translationGroupId: "00000000-0000-0000-0000-000000000011",
        authorId: OWNER_ID,
      },
    ]);
  }
}

describe("L2 · Admin Dashboard 查询", () => {
  it("F1 · KPI 数据正确（agents/essays/drafts/published）", async () => {
    await ensureData();
    const data = await getAdminDashboard();
    expect(data.kpi.agents).toBeGreaterThanOrEqual(3);
    expect(data.kpi.essays).toBeGreaterThanOrEqual(2);
    expect(data.kpi.essaysDraft).toBeGreaterThanOrEqual(1);
    expect(data.kpi.essaysPublished).toBeGreaterThanOrEqual(1);
  });

  it("F2 · TODO draftEssays 列出 draft 文章", async () => {
    await ensureData();
    const data = await getAdminDashboard();
    expect(data.todo.draftEssays.length).toBeGreaterThanOrEqual(1);
    const draft = data.todo.draftEssays.find((e) => e.sn === "SN-DRAFT");
    expect(draft?.title).toBe("Draft Essay");
  });

  it("F3 · TODO incompleteAgents 列出缺 desc / launchUrl 的 agent", async () => {
    await ensureData();
    const data = await getAdminDashboard();
    const missingDesc = data.todo.incompleteAgents.find((a) => a.sn === "CAL.X-03");
    expect(missingDesc?.issue).toBe("缺少描述");
  });

  it("F4 · recentActivity 当前为空（无 audit_logs seed）", async () => {
    await ensureData();
    const data = await getAdminDashboard();
    expect(Array.isArray(data.recentActivity)).toBe(true);
  });
});
