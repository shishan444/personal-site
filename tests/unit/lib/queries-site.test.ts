import { beforeEach, describe, expect, it, vi } from "vitest";

const ESSAY_ROWS = [
  {
    id: "e1",
    sn: "SN-001",
    lang: "zh",
    title: "zh-1",
    deck: "d",
    body: "b",
    typeTag: "essay",
    topicTags: ["ai"],
    status: "published",
    publishedAt: new Date("2026-08-01"),
    slug: "zh-1",
    words: 100,
    readMinutes: 1,
    translationGroupId: "e1",
  },
  {
    id: "e2",
    sn: "SN-002",
    lang: "en",
    title: "en-1",
    deck: "d",
    body: "b",
    typeTag: "essay",
    topicTags: ["ai"],
    status: "published",
    publishedAt: new Date("2026-08-02"),
    slug: "en-1",
    words: 100,
    readMinutes: 1,
    translationGroupId: "e2",
  },
  {
    id: "e3",
    sn: "SN-003",
    lang: "zh",
    title: "draft-zh",
    deck: "d",
    body: "b",
    typeTag: "essay",
    topicTags: [],
    status: "draft",
    publishedAt: null,
    slug: null,
    words: 1,
    readMinutes: 1,
    translationGroupId: "e3",
  },
];

const AGENT_ROWS = [
  {
    id: "a1",
    sn: "A-01",
    name: "n1",
    desc: "d",
    status: "active",
    specs: [],
    launchType: "external",
    launchUrl: null,
    order: 1,
  },
  {
    id: "a2",
    sn: "A-02",
    name: "n2",
    desc: "d",
    status: "archived",
    specs: [],
    launchType: "external",
    launchUrl: null,
    order: 2,
  },
  {
    id: "a3",
    sn: "A-03",
    name: "n3",
    desc: "d",
    status: "beta",
    specs: [],
    launchType: "external",
    launchUrl: null,
    order: 3,
  },
  {
    id: "a4",
    sn: "A-04",
    name: "n4",
    desc: "d",
    status: "coming",
    specs: [],
    launchType: "external",
    launchUrl: null,
    order: 4,
  },
];

const TIMELINE_ROWS = [
  {
    id: "t1",
    version: "v0.1",
    name: "n1",
    desc: "d",
    type: "genesis",
    date: "2025-09-01",
    changes: [],
    filesChanged: null,
    linesAdd: null,
    linesDel: null,
    isNow: false,
  },
  {
    id: "t2",
    version: "v0.4",
    name: "n2",
    desc: "d",
    type: "now",
    date: "2026-07-29",
    changes: [],
    filesChanged: null,
    linesAdd: null,
    linesDel: null,
    isNow: true,
  },
];

const CONFIG_ROW = {
  id: 1,
  siteName: "Atelier",
  subtitle: "sub",
  currentVersion: "v0.4",
  currentCalibre: "04",
  heroSub: "h",
  logoAssetId: null,
  faviconAssetId: null,
  rdMeta1: "m1",
  rdMeta2: "m2",
  subdialsConfig: {
    lu: { enabled: true },
    ru: { enabled: true, tickCount: 5 },
    ld: { enabled: true },
    rd: { enabled: true, meta1: "v0.4", meta2: "NEXT" },
  },
  chaptersConfig: [],
  globalStats: { inService: "{x}", inBeta: "{y}", writing: "{z}", calibre: "{c}" },
  theme: "warm-amber",
  updatedAt: new Date(),
};

let essaysResult: unknown[] = ESSAY_ROWS;
let agentsResult: unknown[] = AGENT_ROWS;
let timelineResult: unknown[] = TIMELINE_ROWS;
let configResult: unknown[] = [CONFIG_ROW];

let schemaRefs: {
  essays: unknown;
  agents: unknown;
  timelineNodes: unknown;
  siteConfig: unknown;
} | null = null;

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(async () => {
    if (!schemaRefs) {
      const mod = await vi.importActual<typeof import("@/lib/db/schema")>("@/lib/db/schema");
      schemaRefs = {
        essays: mod.essays,
        agents: mod.agents,
        timelineNodes: mod.timelineNodes,
        siteConfig: mod.siteConfig,
      };
    }
    const buildChain = (initial: unknown[]) => {
      let rows = initial;
      const self = {
        from: (table: unknown) => {
          if (table === schemaRefs?.essays) rows = essaysResult;
          else if (table === schemaRefs?.agents) rows = agentsResult;
          else if (table === schemaRefs?.timelineNodes) rows = timelineResult;
          else if (table === schemaRefs?.siteConfig) rows = configResult;
          return self;
        },
        where: () => {
          rows = rows.filter((row) => (row as { status?: string }).status === "published");
          return self;
        },
        orderBy: () => self,
        limit: () => self,
      };
      Object.assign(self, {
        // biome-ignore lint/suspicious/noThenProperty: drizzle ORM mock 需 thenable 以同时支持 await 与 .returning() 链
        then: (onFulfilled: (v: unknown[]) => unknown, onRejected?: (e: unknown) => unknown) =>
          Promise.resolve(rows).then(onFulfilled, onRejected),
      });
      return self;
    };
    return {
      select: () => buildChain([]),
    };
  }),
}));

describe("L1 · queries/site 过滤与聚合", () => {
  beforeEach(() => {
    essaysResult = ESSAY_ROWS;
    agentsResult = AGENT_ROWS;
    timelineResult = TIMELINE_ROWS;
    configResult = [CONFIG_ROW];
  });

  it("F1 · getHomeEssays(lang=zh) 只返回 published 的 zh 行", async () => {
    const { getHomeEssays } = await import("@/lib/queries/site");
    const result = await getHomeEssays("zh");
    const titles = result.map((e) => e.title);
    expect(titles).toContain("zh-1");
    expect(titles).not.toContain("en-1");
    expect(titles).not.toContain("draft-zh");
  });

  it("F2 · getHomeEssays(lang=en) 只返回 published 的 en 行", async () => {
    const { getHomeEssays } = await import("@/lib/queries/site");
    const result = await getHomeEssays("en");
    expect(result.map((e) => e.title)).toEqual(["en-1"]);
  });

  it("F3 · getHomeAgents 过滤 status=archived", async () => {
    const { getHomeAgents } = await import("@/lib/queries/site");
    const result = await getHomeAgents();
    const statuses = result.map((a) => a.status);
    expect(statuses).not.toContain("archived");
    expect(statuses).toContain("active");
    expect(statuses).toContain("beta");
    expect(statuses).toContain("coming");
  });

  it("F4 · getHomeTimeline 全量返回", async () => {
    const { getHomeTimeline } = await import("@/lib/queries/site");
    const result = await getHomeTimeline();
    expect(result.length).toBe(2);
  });

  it("F5 · getSiteConfig 返回单行（首行）", async () => {
    const { getSiteConfig } = await import("@/lib/queries/site");
    const config = await getSiteConfig();
    expect(config?.id).toBe(1);
    expect(config?.currentCalibre).toBe("04");
  });

  it("F6 · getSiteStats 聚合 + currentCalibre", async () => {
    const { getSiteStats } = await import("@/lib/queries/site");
    const stats = await getSiteStats();
    expect(stats.agentsActive).toBe(1);
    expect(stats.agentsBeta).toBe(1);
    expect(stats.agentsComing).toBe(1);
    expect(stats.essaysPublished).toBe(2);
    expect(stats.currentCalibre).toBe("04");
  });

  it("F7 · getSiteConfig 表空时返回 null", async () => {
    configResult = [];
    const { getSiteConfig } = await import("@/lib/queries/site");
    const config = await getSiteConfig();
    expect(config).toBeNull();
  });

  it("F8 · getSiteStats config 不存在时 currentCalibre 兜底 04", async () => {
    configResult = [];
    const { getSiteStats } = await import("@/lib/queries/site");
    const stats = await getSiteStats();
    expect(stats.currentCalibre).toBe("04");
  });
});
