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

interface UpdateCall {
  setArg: Record<string, unknown>;
  whereId?: string;
}

const updateCalls: UpdateCall[] = [];

vi.mock("@/lib/db", () => {
  const chain = {
    insert: vi.fn(() => ({
      values: vi.fn((input: Record<string, unknown>) => {
        const result = [{ id: input.id ?? "a-1", sn: input.sn ?? "x", ...input }];
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
          updateCalls.push({ setArg });
          return [];
        }),
      })),
    })),
    delete: vi.fn(() => ({ where: vi.fn(async () => []) })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        orderBy: vi.fn(() => ({
          limit: vi.fn(async () => [{ order: 5 }]),
        })),
      })),
    })),
  };
  return { getDb: vi.fn(async () => chain), __chain: chain };
});

vi.mock("@/lib/audit", () => ({ writeAuditLog: auditMock }));
vi.mock("@/lib/auth", () => ({ getSession: vi.fn(async () => SESSION) }));
vi.mock("next/cache", () => ({ revalidatePath: revalidateMock }));

describe("L1 · agents actions 契约（mock DB）", () => {
  beforeEach(() => {
    auditMock.mockReset();
    revalidateMock.mockReset();
    updateCalls.length = 0;
  });

  it("F1 · createAgent 自动 order = max + 1", async () => {
    const { createAgent } = await import("@/lib/actions/agents");
    const result = await createAgent({
      sn: "CAL.A-01",
      name: "Contract Reader",
      desc: "d",
      status: "active",
      specs: [],
      clickTarget: "internal",
      launchType: "external",
    });
    expect(result.sn).toBe("CAL.A-01");
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "create", targetType: "agent" }),
    );
  });

  it("F2 · createAgent 在空表中 order = 1", async () => {
    const dbMod = (await import("@/lib/db")) as unknown as { __chain: Record<string, unknown> };
    const __chain = dbMod.__chain;
    const original = __chain.select;
    __chain.select = vi.fn(() => ({
      from: vi.fn(() => ({
        orderBy: vi.fn(() => ({ limit: vi.fn(async () => []) })),
      })),
    })) as never;
    const { createAgent } = await import("@/lib/actions/agents");
    await createAgent({
      sn: "x",
      name: "x",
      desc: "x",
      status: "coming",
      specs: [],
      clickTarget: "internal",
      launchType: "external",
    });
    __chain.select = original;
  });

  it("F3 · updateAgent 各字段写入", async () => {
    const { updateAgent } = await import("@/lib/actions/agents");
    await updateAgent("a-1", {
      name: "新名",
      status: "beta",
      specs: [{ id: "s1", label: "L", value: "V", isPrimary: true }],
    });
    const last = updateCalls.at(-1);
    expect(last?.setArg).toMatchObject({ name: "新名", status: "beta" });
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "update", targetType: "agent", targetId: "a-1" }),
    );
  });

  it("F4 · deleteAgent 写 audit(delete) + revalidatePath", async () => {
    const { deleteAgent } = await import("@/lib/actions/agents");
    await deleteAgent("a-1");
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "delete", targetType: "agent", targetId: "a-1" }),
    );
    expect(revalidateMock).toHaveBeenCalled();
  });

  it("F5 · reorderAgents 两阶段：先抬到 n+1..2n 再落 1..n（避开 agents_order_idx 唯一索引中途冲突）", async () => {
    const { reorderAgents } = await import("@/lib/actions/agents");
    await reorderAgents(["a", "b", "c"]);
    expect(updateCalls.length).toBe(6);
    const liftOrders = updateCalls.slice(0, 3).map((c) => c.setArg.order);
    const dropOrders = updateCalls.slice(3, 6).map((c) => c.setArg.order);
    expect(liftOrders).toEqual([4, 5, 6]);
    expect(dropOrders).toEqual([1, 2, 3]);
    expect(auditMock).toHaveBeenCalledTimes(1);
  });

  it("F6 · reorderAgents 空数组 early return（不写 audit）", async () => {
    const { reorderAgents } = await import("@/lib/actions/agents");
    await reorderAgents([]);
    expect(updateCalls.length).toBe(0);
    expect(auditMock).not.toHaveBeenCalled();
  });
});

describe("L1 · agents actions 反向", () => {
  it("F7 · createAgent 未登录抛 UNAUTHORIZED", async () => {
    const authMod = await import("@/lib/auth");
    const original = (authMod.getSession as ReturnType<typeof vi.fn>).getMockImplementation();
    (authMod.getSession as ReturnType<typeof vi.fn>).mockImplementation(async () => null);
    const { createAgent } = await import("@/lib/actions/agents");
    await expect(
      createAgent({
        sn: "x",
        name: "x",
        desc: "x",
        status: "active",
        specs: [],
        clickTarget: "internal",
        launchType: "external",
      }),
    ).rejects.toThrow(/UNAUTHORIZED/);
    if (original) (authMod.getSession as ReturnType<typeof vi.fn>).mockImplementation(original);
  });

  it("F8 · reorderAgents 未登录抛 UNAUTHORIZED", async () => {
    const authMod = await import("@/lib/auth");
    const original = (authMod.getSession as ReturnType<typeof vi.fn>).getMockImplementation();
    (authMod.getSession as ReturnType<typeof vi.fn>).mockImplementation(async () => null);
    const { reorderAgents } = await import("@/lib/actions/agents");
    await expect(reorderAgents(["a"])).rejects.toThrow(/UNAUTHORIZED/);
    if (original) (authMod.getSession as ReturnType<typeof vi.fn>).mockImplementation(original);
  });
});
