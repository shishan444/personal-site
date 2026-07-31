import { eq } from "drizzle-orm";
import type { PgliteDatabase } from "@/lib/db/pglite";
import { agents, essays, siteConfig, timelineNodes, users } from "@/lib/db/schema";

const OWNER_ID = "00000000-0000-0000-0000-000000000001";

export async function loadDemoSeed(db: PgliteDatabase) {
  const existing = await db.select().from(users).where(eq(users.id, OWNER_ID)).limit(1);
  if (existing.length === 0) {
    await db.insert(users).values({
      id: OWNER_ID,
      email: "owner@atelier.com",
      name: "GLM",
      role: "owner",
      emailVerified: true,
      passwordHash: "$argon2id$test",
    });
  }

  await db
    .insert(siteConfig)
    .values({
      id: 1,
      siteName: "Atelier",
      subtitle: "A workshop of agents",
      currentVersion: "v0.4",
      currentCalibre: "04",
      heroSub: "A factory of agents, in kinetic motion.",
      rdMeta1: "v0.4 · UPDATED",
      rdMeta2: "NEXT · EMAIL DRAFTER Q3",
      subdialsConfig: {
        lu: { enabled: true },
        ru: { enabled: true, tickCount: 5 },
        ld: { enabled: true },
        rd: { enabled: true, meta1: "v0.4", meta2: "NEXT" },
      },
      chaptersConfig: [
        { id: "01", name: "HERO", enabled: true, order: 1, required: true },
        { id: "05", name: "OUTRO", enabled: true, order: 5, required: true },
      ],
      globalStats: {
        inService: "{agents_active} agents",
        inBeta: "{agents_beta} agent",
        writing: "{essays_published} essays",
        calibre: "{current_cal}",
      },
      theme: "warm-amber",
    })
    .onConflictDoNothing();

  await db
    .insert(agents)
    .values([
      {
        id: "a0000001-0000-0000-0000-000000000001",
        sn: "CAL.A-01",
        name: "Contract Reader",
        desc: "把合同条款拆成 5 句话",
        status: "active",
        specs: [{ id: "s1", label: "X", value: "1", isPrimary: true }],
        order: 1,
      },
      {
        id: "a0000001-0000-0000-0000-000000000002",
        sn: "CAL.A-02",
        name: "Book Podcast",
        desc: "书 → 播客",
        status: "beta",
        specs: [],
        order: 2,
      },
      {
        id: "a0000001-0000-0000-0000-000000000003",
        sn: "CAL.A-03",
        name: "Diff Narrator",
        desc: "diff → 更新说明",
        status: "archived",
        specs: [],
        order: 3,
      },
      {
        id: "a0000001-0000-0000-0000-000000000004",
        sn: "CAL.A-04",
        name: "Reading Companion",
        desc: "笔记 → 知识卡",
        status: "active",
        specs: [],
        order: 4,
      },
      {
        id: "a0000001-0000-0000-0000-000000000005",
        sn: "CAL.A-05",
        name: "Email Drafter",
        desc: "要点 → 邮件",
        status: "coming",
        specs: [],
        order: 5,
      },
      {
        id: "a0000001-0000-0000-0000-000000000006",
        sn: "CAL.A-06",
        name: "Spec Synthesizer",
        desc: "访谈 → PRD",
        status: "coming",
        specs: [],
        order: 6,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(timelineNodes)
    .values([
      {
        id: "71000001-0000-0000-0000-000000000001",
        version: "v0.1",
        name: "Genesis",
        desc: "立项",
        type: "genesis",
        date: "2025-09-01",
        isNow: false,
      },
      {
        id: "71000001-0000-0000-0000-000000000002",
        version: "v0.1.1",
        name: "First agent",
        desc: "Contract Reader",
        type: "first",
        date: "2025-11-15",
        isNow: false,
      },
      {
        id: "71000001-0000-0000-0000-000000000003",
        version: "v0.2",
        name: "Writing system",
        desc: "重构",
        type: "normal",
        date: "2026-02-03",
        isNow: false,
      },
      {
        id: "71000001-0000-0000-0000-000000000004",
        version: "v0.3",
        name: "External calls",
        desc: "OAuth",
        type: "normal",
        date: "2026-05-12",
        isNow: false,
      },
      {
        id: "71000001-0000-0000-0000-000000000005",
        version: "v0.4",
        name: "Agent atelier",
        desc: "全新视觉",
        type: "now",
        date: "2026-07-29",
        isNow: true,
      },
    ])
    .onConflictDoNothing();

  const essayRows = [
    {
      id: "e0000001-0000-0000-0000-000000000001",
      sn: "SN-028",
      title: "Agents are coworkers",
      deck: "deck",
      body: "body",
      typeTag: "essay" as const,
      status: "published" as const,
      lang: "zh" as const,
      publishedAt: new Date("2026-07-22"),
      slug: "agents-coworkers-zh",
      words: 2840,
      readMinutes: 13,
    },
    {
      id: "e0000001-0000-0000-0000-000000000002",
      sn: "SN-027",
      title: "Long-context findings",
      deck: "deck",
      body: "body",
      typeTag: "note" as const,
      status: "published" as const,
      lang: "zh" as const,
      publishedAt: new Date("2026-07-08"),
      slug: "long-context-zh",
      words: 1920,
      readMinutes: 9,
    },
    {
      id: "e0000001-0000-0000-0000-000000000003",
      sn: "SN-026",
      title: "Build contract agent",
      deck: "deck",
      body: "body",
      typeTag: "tutorial" as const,
      status: "published" as const,
      lang: "zh" as const,
      publishedAt: new Date("2026-06-30"),
      slug: "build-contract-agent-zh",
      words: 5120,
      readMinutes: 24,
    },
    {
      id: "e0000001-0000-0000-0000-000000000004",
      sn: "SN-024",
      title: "Deleted 3 agents",
      deck: "deck",
      body: "body",
      typeTag: "note" as const,
      status: "published" as const,
      lang: "zh" as const,
      publishedAt: new Date("2026-05-29"),
      slug: "deleted-three-zh",
      words: 980,
      readMinutes: 5,
    },
    {
      id: "e0000001-0000-0000-0000-000000000005",
      sn: "SN-022",
      title: "Things that think with you",
      deck: "deck",
      body: "body",
      typeTag: "essay" as const,
      status: "published" as const,
      lang: "zh" as const,
      publishedAt: new Date("2026-04-22"),
      slug: "think-with-you-zh",
      words: 3420,
      readMinutes: 16,
    },
  ];

  for (const e of essayRows) {
    await db
      .insert(essays)
      .values({
        ...e,
        translationGroupId: e.id,
        authorId: OWNER_ID,
      })
      .onConflictDoNothing();
  }
}
