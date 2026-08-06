import { beforeEach, describe, expect, it, vi } from "vitest";

const SESSION = {
  id: "sess-1",
  userId: "u-owner",
  token: "tok",
  expiresAt: new Date(Date.now() + 60_000),
  user: {
    id: "u-owner",
    email: "owner@atelier.com",
    name: "GLM",
    role: "owner" as const,
    mustChangePassword: false,
  },
};

const auditMock = vi.fn();
const revalidateMock = vi.fn();

const insertLog: Array<Record<string, unknown>> = [];
const updateLog: Array<{ setArg: Record<string, unknown> }> = [];

const FAKE_LINKS = [
  {
    id: "l1",
    assetId: "asset-1",
    sourceType: "agent",
    sourceId: "agent-1",
    usage: "screenshot",
    orderIndex: 0,
    caption: "c1",
  },
  {
    id: "l2",
    assetId: "asset-2",
    sourceType: "agent",
    sourceId: "agent-1",
    usage: "screenshot",
    orderIndex: 1,
    caption: null,
  },
];

const FAKE_ASSETS = [
  { id: "asset-1", storagePath: "2026/08/asset-1.png" },
  { id: "asset-2", storagePath: "2026/08/asset-2.png" },
];

let nextMaxOrder: number | null = 0;

let schemaRefs: { assetLinks: unknown; assets: unknown } | null = null;

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(async () => {
    if (!schemaRefs) {
      const mod = await vi.importActual<typeof import("@/lib/db/schema")>("@/lib/db/schema");
      schemaRefs = { assetLinks: mod.assetLinks, assets: mod.assets };
    }
    const selectFn = (fields?: unknown) => {
      const isAggregate = fields !== undefined;
      let rows: unknown[] = isAggregate ? [{ value: nextMaxOrder ?? null }] : [];
      const self: Record<string, unknown> = {
        from: (table: unknown) => {
          if (!isAggregate) {
            rows = table === schemaRefs?.assetLinks ? FAKE_LINKS : FAKE_ASSETS;
          }
          return self;
        },
        where: () => self,
        orderBy: () => self,
      };
      Object.assign(self, {
        // biome-ignore lint/suspicious/noThenProperty: drizzle ORM mock 需 thenable 以同时支持 await 与 .returning() 链
        then: (onFulfilled: (v: unknown[]) => unknown, onRejected?: (e: unknown) => unknown) =>
          Promise.resolve(rows).then(onFulfilled, onRejected),
      });
      return self;
    };
    return {
      select: vi.fn(selectFn),
      insert: vi.fn(() => ({
        values: vi.fn((input: Record<string, unknown>) => {
          insertLog.push(input);
          return Promise.resolve([{ id: "link-new" }]);
        }),
      })),
      update: vi.fn(() => ({
        set: vi.fn((setArg: Record<string, unknown>) => ({
          where: vi.fn(async () => {
            updateLog.push({ setArg });
            return [];
          }),
        })),
      })),
      delete: vi.fn(() => ({ where: vi.fn(async () => []) })),
    };
  }),
}));

vi.mock("@/lib/audit", () => ({ writeAuditLog: auditMock }));
vi.mock("@/lib/auth", () => ({ getSession: vi.fn(async () => SESSION) }));
vi.mock("next/cache", () => ({ revalidatePath: revalidateMock }));

describe("L1 · agent-screenshots actions（mock DB）", () => {
  beforeEach(() => {
    auditMock.mockReset();
    revalidateMock.mockReset();
    insertLog.length = 0;
    updateLog.length = 0;
    nextMaxOrder = 0;
  });

  it("F1 · linkAgentScreenshot 无现有 link 时 orderIndex = (null ?? -1) + 1 = 0", async () => {
    nextMaxOrder = null;
    const { linkAgentScreenshot } = await import("@/lib/actions/agent-screenshots");
    await linkAgentScreenshot("agent-1", "asset-1", "caption");
    const last = insertLog.at(-1);
    expect(last?.orderIndex).toBe(0);
    expect(last?.sourceType).toBe("agent");
    expect(last?.usage).toBe("screenshot");
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "create", targetType: "asset_link" }),
    );
  });

  it("F2 · linkAgentScreenshot orderIndex = maxOrder + 1", async () => {
    nextMaxOrder = 3;
    const { linkAgentScreenshot } = await import("@/lib/actions/agent-screenshots");
    await linkAgentScreenshot("agent-1", "asset-2");
    const last = insertLog.at(-1);
    expect(last?.orderIndex).toBe(4);
  });

  it("F3 · linkAgentScreenshot 空白 caption 转 null", async () => {
    nextMaxOrder = null;
    const { linkAgentScreenshot } = await import("@/lib/actions/agent-screenshots");
    await linkAgentScreenshot("agent-1", "asset-3", "   ");
    const last = insertLog.at(-1);
    expect(last?.caption).toBeNull();
  });

  it("F4 · unlinkAgentScreenshot 写 audit(delete)", async () => {
    const { unlinkAgentScreenshot } = await import("@/lib/actions/agent-screenshots");
    await unlinkAgentScreenshot("link-99");
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "delete", targetType: "asset_link", targetId: "link-99" }),
    );
  });

  it("F5 · reorderAgentScreenshots 按顺序更新每行 orderIndex", async () => {
    const { reorderAgentScreenshots } = await import("@/lib/actions/agent-screenshots");
    await reorderAgentScreenshots("agent-1", ["l2", "l1", "l3"]);
    expect(updateLog.length).toBe(3);
    expect(updateLog[0]?.setArg.orderIndex).toBe(0);
    expect(updateLog[1]?.setArg.orderIndex).toBe(1);
    expect(updateLog[2]?.setArg.orderIndex).toBe(2);
  });

  it("F6 · reorderAgentScreenshots 空数组 early return", async () => {
    const { reorderAgentScreenshots } = await import("@/lib/actions/agent-screenshots");
    await reorderAgentScreenshots("agent-1", []);
    expect(updateLog.length).toBe(0);
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("F7 · listAgentScreenshotLinks 返回 url + caption + orderIndex", async () => {
    const { listAgentScreenshotLinks } = await import("@/lib/actions/agent-screenshots");
    const links = await listAgentScreenshotLinks("agent-1");
    expect(links.length).toBe(2);
    expect(links[0]?.url).toMatch(/^\/uploads\//);
    expect(links[0]?.orderIndex).toBe(0);
  });
});

describe("L1 · agent-screenshots 反向", () => {
  it("F8 · linkAgentScreenshot 未登录抛 UNAUTHORIZED", async () => {
    const authMod = await import("@/lib/auth");
    const original = (authMod.getSession as ReturnType<typeof vi.fn>).getMockImplementation();
    (authMod.getSession as ReturnType<typeof vi.fn>).mockImplementation(async () => null);
    const { linkAgentScreenshot } = await import("@/lib/actions/agent-screenshots");
    await expect(linkAgentScreenshot("a", "b")).rejects.toThrow(/UNAUTHORIZED/);
    if (original) (authMod.getSession as ReturnType<typeof vi.fn>).mockImplementation(original);
  });
});
