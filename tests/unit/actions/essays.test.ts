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

interface MockRow extends Record<string, unknown> {
  id: string;
  sn: string;
  lang: "zh" | "en";
  translationGroupId: string;
  title: string;
  deck: string;
  body: string;
  typeTag: "essay" | "note" | "tutorial";
  topicTags: string[];
  status: "draft" | "published" | "archived";
  publishedAt: Date | null;
  slug: string | null;
  isPinned: boolean;
  relatedAgentId: string | null;
  ogImageAssetId: string | null;
  authorId: string;
  words: number;
  readMinutes: number;
}

function makeRow(overrides: Partial<MockRow> = {}): MockRow {
  return {
    id: "e-1",
    sn: "SN-001",
    lang: "zh",
    translationGroupId: "e-1",
    title: "t",
    deck: "d",
    body: "b",
    typeTag: "essay",
    topicTags: [],
    status: "draft",
    publishedAt: null,
    slug: null,
    isPinned: false,
    relatedAgentId: null,
    ogImageAssetId: null,
    authorId: "u-owner",
    words: 1,
    readMinutes: 1,
    ...overrides,
  };
}

const auditMock = vi.fn();
const revalidateMock = vi.fn();

const insertValuesLog: Array<Record<string, unknown>> = [];
const revisionInsertLog: Array<Record<string, unknown>> = [];
const updateSetLog: Array<{ setArg: Record<string, unknown> }> = [];

let existingRowForUpdate: MockRow | null = makeRow();
let revisionRowForRestore: Record<string, unknown> | null = null;
let nextReturningRow: MockRow | null = makeRow();

function buildInsertChain() {
  const insertFn = vi.fn(() => {
    return {
      values: vi.fn((input: Record<string, unknown>) => {
        const isRevision = "essayId" in input && "snapshot" in input && "action" in input;
        if (isRevision) revisionInsertLog.push(input);
        else insertValuesLog.push(input);
        const baseRow = isRevision ? input : { ...makeRow(), ...input };
        const chain = {
          returning: vi.fn(async () => {
            nextReturningRow = { ...(nextReturningRow ?? makeRow()), ...input } as MockRow;
            return [nextReturningRow];
          }),
        };
        Object.assign(chain, {
          // biome-ignore lint/suspicious/noThenProperty: drizzle ORM mock 需 thenable 以同时支持 await 与 .returning() 链
          then: (onFulfilled: (v: unknown[]) => unknown, onRejected?: (e: unknown) => unknown) =>
            Promise.resolve([baseRow]).then(onFulfilled, onRejected),
        });
        return chain;
      }),
    };
  });
  return insertFn;
}

const updateFn = vi.fn(() => ({
  set: vi.fn((setArg: Record<string, unknown>) => {
    updateSetLog.push({ setArg });
    return {
      where: vi.fn(async () => {
        nextReturningRow = { ...(nextReturningRow ?? makeRow()), ...setArg } as MockRow;
        return [];
      }),
    };
  }),
}));

const deleteFn = vi.fn(() => ({ where: vi.fn(async () => []) }));

const selectFn = vi.fn(() => ({
  from: vi.fn(() => ({
    where: vi.fn(() => ({
      limit: vi.fn(async () => {
        if (existingRowForUpdate) return [existingRowForUpdate];
        if (revisionRowForRestore) return [revisionRowForRestore];
        return [];
      }),
    })),
  })),
}));

const insertFn = buildInsertChain();

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(async () => ({
    insert: insertFn,
    update: updateFn,
    delete: deleteFn,
    select: selectFn,
  })),
}));
vi.mock("@/lib/audit", () => ({ writeAuditLog: auditMock }));
vi.mock("@/lib/auth", () => ({ getSession: vi.fn(async () => SESSION) }));
vi.mock("@/lib/markdown", () => ({ countWords: vi.fn(() => 100), readingTime: vi.fn(() => 1) }));
vi.mock("next/cache", () => ({ revalidatePath: revalidateMock }));

describe("L1 · essays actions 契约（mock DB）", () => {
  beforeEach(() => {
    auditMock.mockReset();
    revalidateMock.mockReset();
    insertValuesLog.length = 0;
    revisionInsertLog.length = 0;
    updateSetLog.length = 0;
    existingRowForUpdate = makeRow();
    revisionRowForRestore = null;
    nextReturningRow = makeRow();
  });

  it("F1 · createEssay 写 revision(created) + audit(create) + 返回 id/sn", async () => {
    const { createEssay } = await import("@/lib/actions/essays");
    const result = await createEssay({
      sn: "SN-001",
      lang: "zh",
      title: "测试",
      deck: "d",
      body: "正文",
      typeTag: "essay",
      topicTags: [],
      status: "draft",
      slug: null,
    });
    expect(result.sn).toBe("SN-001");
    expect(auditMock).toHaveBeenCalledTimes(1);
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "create", targetType: "essay" }),
    );
    expect(revisionInsertLog.at(-1)?.action).toBe("created");
  });

  it("F2 · createEssay status=published 时 publishedAt 非空", async () => {
    const { createEssay } = await import("@/lib/actions/essays");
    await createEssay({
      sn: "SN-002",
      lang: "zh",
      title: "x",
      deck: "x",
      body: "x",
      typeTag: "essay",
      topicTags: [],
      status: "published",
      slug: "x",
    });
    expect(insertValuesLog.at(-1)?.publishedAt).toBeInstanceOf(Date);
  });

  it("F3 · createEssay status=draft 时 publishedAt 为 null", async () => {
    const { createEssay } = await import("@/lib/actions/essays");
    await createEssay({
      sn: "SN-003",
      lang: "zh",
      title: "x",
      deck: "x",
      body: "x",
      typeTag: "essay",
      topicTags: [],
      status: "draft",
      slug: "x",
    });
    expect(insertValuesLog.at(-1)?.publishedAt).toBeNull();
  });

  it("F4 · updateEssay 状态 draft→published 写 revision(published) + audit(publish)", async () => {
    existingRowForUpdate = makeRow({ status: "draft" });
    const { updateEssay } = await import("@/lib/actions/essays");
    await updateEssay("e-1", { status: "published" });
    expect(revisionInsertLog.at(-1)?.action).toBe("published");
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "publish", targetType: "essay" }),
    );
  });

  it("F5 · updateEssay 状态 published→archived 写 revision(archived) + audit(archive)", async () => {
    existingRowForUpdate = makeRow({ status: "published", publishedAt: new Date("2026-01-01") });
    const { updateEssay } = await import("@/lib/actions/essays");
    await updateEssay("e-1", { status: "archived" });
    expect(revisionInsertLog.at(-1)?.action).toBe("archived");
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "archive", targetType: "essay" }),
    );
  });

  it("F6 · updateEssay 同状态只 edit", async () => {
    existingRowForUpdate = makeRow({ status: "draft" });
    const { updateEssay } = await import("@/lib/actions/essays");
    await updateEssay("e-1", { title: "新标题" });
    expect(revisionInsertLog.at(-1)?.action).toBe("edited");
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "update", targetType: "essay" }),
    );
  });

  it("F7 · publishEssay 委托 updateEssay 设 published", async () => {
    existingRowForUpdate = makeRow({ status: "draft" });
    const { publishEssay } = await import("@/lib/actions/essays");
    await publishEssay("e-1");
    expect(auditMock).toHaveBeenCalledWith(expect.objectContaining({ action: "publish" }));
  });

  it("F8 · archiveEssay 委托 updateEssay 设 archived", async () => {
    existingRowForUpdate = makeRow({ status: "published" });
    const { archiveEssay } = await import("@/lib/actions/essays");
    await archiveEssay("e-1");
    expect(auditMock).toHaveBeenCalledWith(expect.objectContaining({ action: "archive" }));
  });

  it("F9 · restoreEssay 委托 updateEssay 设 published（archived→published）", async () => {
    existingRowForUpdate = makeRow({ status: "archived" });
    const { restoreEssay } = await import("@/lib/actions/essays");
    await restoreEssay("e-1");
    expect(revisionInsertLog.at(-1)?.action).toBe("published");
  });

  it("F10 · deleteEssay 级联删 revisions + audit(delete)", async () => {
    const { deleteEssay } = await import("@/lib/actions/essays");
    await deleteEssay("e-1");
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "delete", targetType: "essay", targetId: "e-1" }),
    );
  });

  it("F11 · batchUpdateStatus 空数组 early return 0", async () => {
    const { batchUpdateStatus } = await import("@/lib/actions/essays");
    const n = await batchUpdateStatus([], "published");
    expect(n).toBe(0);
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("F12 · batchUpdateStatus 多 id 写 audit 含 metadata.ids", async () => {
    const { batchUpdateStatus } = await import("@/lib/actions/essays");
    const n = await batchUpdateStatus(["e-1", "e-2"], "archived");
    expect(n).toBe(2);
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "archive",
        metadata: { ids: ["e-1", "e-2"] },
      }),
    );
  });

  it("F13 · restoreEssayRevision 找不到 revision 抛 NOT_FOUND", async () => {
    existingRowForUpdate = null;
    revisionRowForRestore = null;
    const { restoreEssayRevision } = await import("@/lib/actions/essays");
    await expect(restoreEssayRevision("e-1", "r-missing")).rejects.toThrow(/NOT_FOUND/);
  });

  it("F14 · restoreEssayRevision 正向：写 restored revision + audit(update)", async () => {
    revisionRowForRestore = {
      id: "r-1",
      essayId: "e-1",
      sn: "SN-001",
      snapshot: {
        title: "旧",
        deck: "d",
        body: "旧正文",
        typeTag: "essay",
        topicTags: ["t1"],
        slug: "old-slug",
      },
      action: "published",
      createdBy: "u-owner",
    };
    existingRowForUpdate = null;
    const { restoreEssayRevision } = await import("@/lib/actions/essays");
    await restoreEssayRevision("e-1", "r-1");
    expect(revisionInsertLog.at(-1)?.action).toBe("restored");
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "update", targetType: "essay", targetId: "e-1" }),
    );
  });
});

describe("L1 · essays actions 反向", () => {
  it("F15 · createEssay 未登录抛 UNAUTHORIZED", async () => {
    const authMod = await import("@/lib/auth");
    const original = (authMod.getSession as ReturnType<typeof vi.fn>).getMockImplementation();
    (authMod.getSession as ReturnType<typeof vi.fn>).mockImplementation(async () => null);
    const { createEssay } = await import("@/lib/actions/essays");
    await expect(
      createEssay({
        sn: "x",
        lang: "zh",
        title: "x",
        deck: "x",
        body: "x",
        typeTag: "essay",
        topicTags: [],
        status: "draft",
        slug: null,
      }),
    ).rejects.toThrow(/UNAUTHORIZED/);
    if (original) (authMod.getSession as ReturnType<typeof vi.fn>).mockImplementation(original);
  });

  it("F16 · updateEssay 不存在抛 NOT_FOUND", async () => {
    existingRowForUpdate = null;
    revisionRowForRestore = null;
    const { updateEssay } = await import("@/lib/actions/essays");
    await expect(updateEssay("e-missing", { title: "x" })).rejects.toThrow(/NOT_FOUND/);
  });
});
