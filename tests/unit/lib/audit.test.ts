import { beforeEach, describe, expect, it, vi } from "vitest";

const valuesFn = vi.fn(async (_input?: unknown) => [] as unknown[]);
const insertFn = vi.fn(() => ({ values: valuesFn }));

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(async () => ({ insert: insertFn })),
}));

describe("L1 · audit.ts 容错与契约", () => {
  beforeEach(() => {
    valuesFn.mockReset();
    insertFn.mockReset();
    insertFn.mockImplementation(() => ({ values: valuesFn }));
  });

  it("F1 · writeAuditLog 正常路径：调用 db.insert(auditLogs).values(obj)", async () => {
    const { writeAuditLog } = await import("@/lib/audit");
    await writeAuditLog({
      userId: "u1",
      action: "create",
      targetType: "essay",
      targetId: "e1",
      summary: "test",
    });
    expect(insertFn).toHaveBeenCalledTimes(1);
    expect(valuesFn).toHaveBeenCalledTimes(1);
    expect(valuesFn.mock.calls[0]?.[0]).toMatchObject({
      userId: "u1",
      action: "create",
      targetType: "essay",
      targetId: "e1",
      summary: "test",
      metadata: null,
    });
  });

  it("F2 · writeAuditLog 默认值：未传字段填 null", async () => {
    const { writeAuditLog } = await import("@/lib/audit");
    await writeAuditLog({ action: "update", targetType: "agent" });
    expect(valuesFn.mock.calls[0]?.[0]).toMatchObject({
      userId: null,
      targetId: null,
      summary: null,
      metadata: null,
      action: "update",
      targetType: "agent",
    });
  });

  it("F3 · writeAuditLog DB 失败应吞错不抛（保证不阻断主流程）", async () => {
    valuesFn.mockRejectedValueOnce(new Error("connection lost"));
    const consoleErr = vi.spyOn(console, "error").mockImplementation(() => {});
    const { writeAuditLog } = await import("@/lib/audit");
    await expect(writeAuditLog({ action: "delete", targetType: "asset" })).resolves.toBeUndefined();
    expect(consoleErr).toHaveBeenCalled();
    consoleErr.mockRestore();
  });
});
