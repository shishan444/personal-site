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

const updateWhereLog: Array<{ setArg: Record<string, unknown>; whereDesc?: string }> = [];

vi.mock("@/lib/db", () => {
  const chain = {
    insert: vi.fn(() => ({
      values: vi.fn((input: Record<string, unknown>) => {
        const result = [{ id: input.id ?? "t-1", ...input }];
        const resultChain: { returning: () => Promise<unknown[]>; then?: unknown } = {
          returning: vi.fn(async () => result),
        };
        Object.assign(resultChain, {
          // biome-ignore lint/suspicious/noThenProperty: drizzle ORM mock 需 thenable 以同时支持 await 与 .returning() 链
          then: (onFulfilled: (v: unknown[]) => unknown, onRejected?: (e: unknown) => unknown) =>
            Promise.resolve(result).then(onFulfilled, onRejected),
        });
        return resultChain;
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn((setArg: Record<string, unknown>) => ({
        where: vi.fn(async () => {
          updateWhereLog.push({ setArg });
          return [];
        }),
      })),
    })),
    delete: vi.fn(() => ({ where: vi.fn(async () => []) })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => []) })) })),
    })),
  };
  return { getDb: vi.fn(async () => chain), __chain: chain };
});

vi.mock("@/lib/audit", () => ({ writeAuditLog: auditMock }));
vi.mock("@/lib/auth", () => ({ getSession: vi.fn(async () => SESSION) }));
vi.mock("next/cache", () => ({ revalidatePath: revalidateMock }));

describe("L1 · timeline actions 契约（mock DB）", () => {
  beforeEach(() => {
    auditMock.mockReset();
    revalidateMock.mockReset();
    updateWhereLog.length = 0;
  });

  it("F1 · createTimelineNode isNow=false 不取消其他", async () => {
    const { createTimelineNode } = await import("@/lib/actions/timeline");
    const result = await createTimelineNode({
      version: "v0.5",
      name: "x",
      desc: "x",
      type: "normal",
      date: "2026-08-06",
      changes: [],
      filesChanged: null,
      linesAdd: null,
      linesDel: null,
      isNow: false,
    });
    expect(result.id).toBe("t-1");
    const cancelOps = updateWhereLog.filter((op) => op.setArg.isNow === false);
    expect(cancelOps.length).toBe(0);
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "create", targetType: "timeline_node" }),
    );
  });

  it("F2 · createTimelineNode isNow=true 先取消其他 NOW（update isNow=false）", async () => {
    const { createTimelineNode } = await import("@/lib/actions/timeline");
    await createTimelineNode({
      version: "v0.5",
      name: "x",
      desc: "x",
      type: "now",
      date: "2026-08-06",
      changes: [],
      filesChanged: null,
      linesAdd: null,
      linesDel: null,
      isNow: true,
    });
    const cancelOps = updateWhereLog.filter((op) => op.setArg.isNow === false);
    expect(cancelOps.length).toBe(1);
  });

  it("F3 · updateTimelineNode isNow=true 同样先取消其他", async () => {
    const { updateTimelineNode } = await import("@/lib/actions/timeline");
    await updateTimelineNode("t-1", {
      version: "v0.5",
      name: "x",
      desc: "x",
      type: "now",
      date: "2026-08-06",
      changes: [],
      filesChanged: null,
      linesAdd: null,
      linesDel: null,
      isNow: true,
    });
    const cancelOps = updateWhereLog.filter((op) => op.setArg.isNow === false);
    expect(cancelOps.length).toBe(1);
  });

  it("F4 · setAsNow 双阶段：取消其他 + 设目标 type=now + audit", async () => {
    const { setAsNow } = await import("@/lib/actions/timeline");
    await setAsNow("t-target");
    expect(updateWhereLog.length).toBe(2);
    expect(updateWhereLog[0]?.setArg).toMatchObject({ isNow: false });
    expect(updateWhereLog[1]?.setArg).toMatchObject({ isNow: true, type: "now" });
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        targetType: "timeline_node",
        targetId: "t-target",
      }),
    );
  });

  it("F5 · deleteTimelineNode 写 audit(delete)", async () => {
    const { deleteTimelineNode } = await import("@/lib/actions/timeline");
    await deleteTimelineNode("t-1");
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "delete", targetType: "timeline_node", targetId: "t-1" }),
    );
  });
});

describe("L1 · timeline actions 反向", () => {
  it("F6 · createTimelineNode 未登录抛 UNAUTHORIZED", async () => {
    const authMod = await import("@/lib/auth");
    const original = (authMod.getSession as ReturnType<typeof vi.fn>).getMockImplementation();
    (authMod.getSession as ReturnType<typeof vi.fn>).mockImplementation(async () => null);
    const { createTimelineNode } = await import("@/lib/actions/timeline");
    await expect(
      createTimelineNode({
        version: "v0.5",
        name: "x",
        desc: "x",
        type: "normal",
        date: "2026-08-06",
        changes: [],
        filesChanged: null,
        linesAdd: null,
        linesDel: null,
      }),
    ).rejects.toThrow(/UNAUTHORIZED/);
    if (original) (authMod.getSession as ReturnType<typeof vi.fn>).mockImplementation(original);
  });
});
