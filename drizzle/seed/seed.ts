import { eq } from "drizzle-orm";
import { getDb } from "../../src/lib/db";
import { agents, assets, essays, siteConfig, timelineNodes, users } from "../../src/lib/db/schema";

const OWNER_ID = "00000000-0000-0000-0000-000000000001";

const demoAgents = [
  {
    id: "a0000001-0000-0000-0000-000000000001",
    sn: "CAL.A-01",
    name: "Contract <em>Reader</em>",
    desc: "把合同条款拆成 5 句话，标红风险点。",
    status: "active" as const,
    specs: [
      { id: "s1", label: "CALLS/WK", value: "1,247", isPrimary: true },
      { id: "s2", label: "LATENCY", value: "4.2s", isPrimary: false },
      { id: "s3", label: "LANGS", value: "zh / en", isPrimary: false },
    ],
    launchUrl: "https://example.com/contract-reader",
    order: 1,
    publishedAt: new Date("2025-11-15"),
  },
  {
    id: "a0000001-0000-0000-0000-000000000002",
    sn: "CAL.A-02",
    name: "Book → <em>Podcast</em>",
    desc: "把一本书拆解成 20 期播客稿。",
    status: "beta" as const,
    specs: [
      { id: "s1", label: "BOOKS", value: "14", isPrimary: true },
      { id: "s2", label: "EPISODES", value: "278", isPrimary: false },
      { id: "s3", label: "AVG LEN", value: "8,200 w", isPrimary: false },
    ],
    launchUrl: "https://example.com/book-podcast",
    order: 2,
    publishedAt: new Date("2026-04-02"),
  },
  {
    id: "a0000001-0000-0000-0000-000000000003",
    sn: "CAL.A-03",
    name: "Diff <em>Narrator</em>",
    desc: "把代码 diff 翻译成产品更新说明。",
    status: "archived" as const,
    specs: [
      { id: "s1", label: "RUNS", value: "412", isPrimary: true },
      { id: "s2", label: "STATUS", value: "superseded", isPrimary: false },
    ],
    launchUrl: "https://example.com/diff-narrator",
    order: 3,
    publishedAt: new Date("2026-02-20"),
  },
  {
    id: "a0000001-0000-0000-0000-000000000004",
    sn: "CAL.A-04",
    name: "Reading <em>Companion</em>",
    desc: "把阅读笔记转成可搜索的知识卡片。",
    status: "active" as const,
    specs: [
      { id: "s1", label: "CALLS/WK", value: "87", isPrimary: true },
      { id: "s2", label: "CARDS", value: "2,140", isPrimary: false },
    ],
    launchUrl: "https://example.com/reading-companion",
    order: 4,
    publishedAt: new Date("2026-05-18"),
  },
  {
    id: "a0000001-0000-0000-0000-000000000005",
    sn: "CAL.A-05",
    name: "Email <em>Drafter</em>",
    desc: "把要点列表转成 3 版风格化邮件。",
    status: "coming" as const,
    specs: [{ id: "s1", label: "STATUS", value: "Q3 2026", isPrimary: true }],
    launchUrl: null,
    order: 5,
    publishedAt: new Date("2026-07-29"),
  },
  {
    id: "a0000001-0000-0000-0000-000000000006",
    sn: "CAL.A-06",
    name: "Spec <em>Synthesizer</em>",
    desc: "把多份用户访谈合成 PRD 初稿。",
    status: "coming" as const,
    specs: [{ id: "s1", label: "STATUS", value: "Q4 2026", isPrimary: true }],
    launchUrl: null,
    order: 6,
    publishedAt: new Date("2026-07-29"),
  },
];

const demoTimelineNodes = [
  {
    id: "71000001-0000-0000-0000-000000000001",
    version: "v0.1",
    name: "<em>Genesis</em>",
    desc: "项目立项 · 第一行代码 · 仓库初始化",
    type: "genesis" as const,
    date: "2025-09-01",
    changes: [{ id: "c1", type: "add" as const, text: "Repo + Stack decision" }],
    filesChanged: 12,
    linesAdd: 1240,
    linesDel: 0,
    isNow: false,
  },
  {
    id: "71000001-0000-0000-0000-000000000002",
    version: "v0.1.1",
    name: "First <em>agent</em>",
    desc: "Contract Reader 上线 · 第一个真实调用",
    type: "first" as const,
    date: "2025-11-15",
    changes: [{ id: "c1", type: "add" as const, text: "Contract Reader shipped" }],
    filesChanged: 38,
    linesAdd: 4200,
    linesDel: 320,
    isNow: false,
  },
  {
    id: "71000001-0000-0000-0000-000000000003",
    version: "v0.2",
    name: "Writing <em>system</em>",
    desc: "文章系统重构 · Markdown 渲染 + 双层 Tag",
    type: "normal" as const,
    date: "2026-02-03",
    changes: [
      { id: "c1", type: "add" as const, text: "Markdown + Shiki code highlight" },
      { id: "c2", type: "add" as const, text: "Type tag (essay/note/tutorial)" },
    ],
    filesChanged: 64,
    linesAdd: 8900,
    linesDel: 1240,
    isNow: false,
  },
  {
    id: "71000001-0000-0000-0000-000000000004",
    version: "v0.3",
    name: "External <em>calls</em>",
    desc: "Agent 外部调用 · OAuth + Webhook",
    type: "normal" as const,
    date: "2026-05-12",
    changes: [
      { id: "c1", type: "add" as const, text: "External call bridge" },
      { id: "c2", type: "mod" as const, text: "Auth flow upgrade" },
    ],
    filesChanged: 47,
    linesAdd: 5400,
    linesDel: 980,
    isNow: false,
  },
  {
    id: "71000001-0000-0000-0000-000000000005",
    version: "v0.4",
    name: "Agent <em>atelier</em>",
    desc: "全新视觉 · 滚动联动机芯 · 三种章节机制",
    type: "now" as const,
    date: "2026-07-29",
    changes: [
      { id: "c1", type: "add" as const, text: "Horizontal scroll choreography" },
      { id: "c2", type: "add" as const, text: "PPT toggle for WRITING" },
      { id: "c3", type: "mod" as const, text: "Whole-site refresh" },
    ],
    filesChanged: 112,
    linesAdd: 18400,
    linesDel: 4200,
    isNow: true,
  },
];

const demoEssays = [
  {
    id: "e0000001-0000-0000-0000-000000000001",
    sn: "SN-028",
    lang: "zh" as const,
    title: "Agents are <em>coworkers</em>, not tools",
    deck: "把 agent 当工具，你会得到一次性结果；当同事，你会得到一个会成长的合作者。",
    body: "## 起\n\n大多数人把 agent 当作查询引擎：问一个问题，拿一个答案。\n\n但 agent 的真正价值不在回答，而在持有上下文。\n\n## 承\n\n一个 coworker 知道你上周做了什么、为什么这么做、哪些方案你试过不工作。\n\n## 转\n\n给 agent 写 system prompt 时，不要写任务，写关系。",
    typeTag: "essay" as const,
    topicTags: ["AI", "Agent"],
    status: "published" as const,
    publishedAt: new Date("2026-07-22"),
    slug: "agents-are-coworkers-zh",
    words: 2840,
    readMinutes: 13,
  },
  {
    id: "e0000001-0000-0000-0000-000000000002",
    sn: "SN-027",
    lang: "zh" as const,
    title: "Five findings on long-context <em>retrieval</em>",
    deck: "把 200K context 跑了 500 次后，我们学到的五件事。",
    body: "## 1. Chunk size 不是越大越好\n...\n## 2. Retrieval 不死，只是变形\n...",
    typeTag: "note" as const,
    topicTags: ["RAG", "LLM"],
    status: "published" as const,
    publishedAt: new Date("2026-07-08"),
    slug: "long-context-retrieval-zh",
    words: 1920,
    readMinutes: 9,
  },
  {
    id: "e0000001-0000-0000-0000-000000000003",
    sn: "SN-026",
    lang: "zh" as const,
    title: "Building a contract <em>agent</em> from scratch",
    deck: "完整教程：从 system prompt 到生产部署，搭一个能用的合同助手。",
    body: "## 步骤一：定义任务范围\n...",
    typeTag: "tutorial" as const,
    topicTags: ["AI", "Tutorial"],
    status: "published" as const,
    publishedAt: new Date("2026-06-30"),
    slug: "build-contract-agent-zh",
    words: 5120,
    readMinutes: 24,
  },
  {
    id: "e0000001-0000-0000-0000-000000000004",
    sn: "SN-024",
    lang: "zh" as const,
    title: "Why I deleted three agents this month",
    deck: "3 个我亲手废掉的 agent，和它们教会我的事。",
    body: "本月我删掉了 3 个 agent。每一个都跑得起来，但都不该存在。",
    typeTag: "note" as const,
    topicTags: ["Build", "Agent"],
    status: "published" as const,
    publishedAt: new Date("2026-05-29"),
    slug: "deleted-three-agents-zh",
    words: 980,
    readMinutes: 5,
  },
  {
    id: "e0000001-0000-0000-0000-000000000005",
    sn: "SN-022",
    lang: "zh" as const,
    title: "Things that <em>think</em> with you",
    deck: "不是替你思考，是和你一起思考。",
    body: "工具替你做事。同事和你共事。差别在 ownership。",
    typeTag: "essay" as const,
    topicTags: ["AI", "Thinking"],
    status: "published" as const,
    publishedAt: new Date("2026-04-22"),
    slug: "things-that-think-with-you-zh",
    words: 3420,
    readMinutes: 16,
  },
];

const demoSiteConfig = {
  id: 1,
  siteName: "Atelier",
  subtitle: "A workshop of agents",
  currentVersion: "v0.4",
  currentCalibre: "04",
  heroSub: "A factory of agents, in kinetic motion.",
  rdMeta1: "v0.4 · UPDATED 3D AGO",
  rdMeta2: "NEXT · EMAIL DRAFTER Q3",
  subdialsConfig: {
    lu: { enabled: true },
    ru: { enabled: true, tickCount: 5 },
    ld: { enabled: true },
    rd: { enabled: true, meta1: "v0.4 · UPDATED 3D AGO", meta2: "NEXT · EMAIL DRAFTER Q3" },
  },
  chaptersConfig: [
    { id: "01", name: "HERO", enabled: true, order: 1, required: true },
    { id: "02", name: "WRITING", enabled: true, order: 2, required: false },
    { id: "03", name: "AGENTS", enabled: true, order: 3, required: false },
    { id: "04", name: "TIMELINE", enabled: true, order: 4, required: false },
    { id: "05", name: "OUTRO", enabled: true, order: 5, required: true },
  ],
  globalStats: {
    inService: "{agents_active} agents",
    inBeta: "{agents_beta} agent",
    writing: "{essays_published} essays",
    calibre: "{current_cal} · 28.8k vph",
  },
  theme: "warm-amber",
};

async function main() {
  const db = await getDb();

  const existingOwner = await db.select().from(users).where(eq(users.id, OWNER_ID)).limit(1);
  if (existingOwner.length === 0) {
    const { hashPassword } = await import("../../src/lib/auth/password");
    const passwordHash = await hashPassword("ChangeMe-On-First-Login");
    await db
      .insert(users)
      .values({
        id: OWNER_ID,
        email: "owner@atelier.com",
        name: "GLM",
        role: "owner",
        emailVerified: true,
        mustChangePassword: true,
        passwordHash,
      })
      .execute();
    console.log("[seed] ✓ owner user (email=owner@atelier.com, password=ChangeMe-On-First-Login)");
  } else {
    console.log("[seed] · owner exists, skip");
  }

  await db.insert(siteConfig).values(demoSiteConfig).onConflictDoNothing().execute();
  console.log("[seed] ✓ site_config");

  await db.insert(agents).values(demoAgents).onConflictDoNothing().execute();
  console.log(`[seed] ✓ ${demoAgents.length} agents`);

  await db.insert(timelineNodes).values(demoTimelineNodes).onConflictDoNothing().execute();
  console.log(`[seed] ✓ ${demoTimelineNodes.length} timeline nodes`);

  for (const essay of demoEssays) {
    await db
      .insert(essays)
      .values({
        ...essay,
        translationGroupId: essay.id,
        authorId: OWNER_ID,
      })
      .onConflictDoNothing()
      .execute();
  }
  console.log(`[seed] ✓ ${demoEssays.length} essays`);

  const assetCount = await db.select().from(assets).limit(1).execute();
  console.log(`[seed] · assets: ${assetCount.length} (will be added via admin upload later)`);

  console.log("[seed] ✅ done");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed] ❌", err);
    process.exit(1);
  });
