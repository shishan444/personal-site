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

interface FakeEssay {
  id: string;
  topicTags: string[];
}

const updateLog: Array<{ id: string; topicTags: string[] }> = [];
let fakeEssays: FakeEssay[] = [];

vi.mock("@/lib/db", () => {
  const chain = {
    select: vi.fn(() => ({
      from: vi.fn(async () => fakeEssays),
    })),
    update: vi.fn(() => ({
      set: vi.fn((setArg: { topicTags?: string[] }) => ({
        where: vi.fn(async (cond: unknown) => {
          const id = (cond as { id?: string })?.id ?? "unknown";
          if (setArg.topicTags) updateLog.push({ id, topicTags: setArg.topicTags });
          return [];
        }),
      })),
    })),
  };
  return { getDb: vi.fn(async () => chain), __chain: chain };
});

vi.mock("@/lib/audit", () => ({ writeAuditLog: auditMock }));
vi.mock("@/lib/auth", () => ({ getSession: vi.fn(async () => SESSION) }));
vi.mock("next/cache", () => ({ revalidatePath: revalidateMock }));

describe("L1 · tags actions mergeTopicTag（mock DB）", () => {
  beforeEach(() => {
    auditMock.mockReset();
    revalidateMock.mockReset();
    updateLog.length = 0;
    fakeEssays = [];
  });

  it("F1 · 替换 src → dst 在多文章中（包含去重）", async () => {
    fakeEssays = [
      { id: "e1", topicTags: ["ai", "essay"] },
      { id: "e2", topicTags: ["ai", "note"] },
      { id: "e3", topicTags: ["other"] },
    ];
    const { mergeTopicTag } = await import("@/lib/actions/tags");
    const result = await mergeTopicTag("ai", "ml");
    expect(result.affected).toBe(2);
    expect(updateLog.length).toBe(2);
    const allTags = updateLog.map((u) => u.topicTags);
    expect(allTags).toContainEqual(["ml", "essay"]);
    expect(allTags).toContainEqual(["ml", "note"]);
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        targetType: "tag",
        summary: expect.stringMatching(/合并标签 ai → ml/),
      }),
    );
  });

  it("F2 · src === dst 返回 0（不写 audit）", async () => {
    const { mergeTopicTag } = await import("@/lib/actions/tags");
    const result = await mergeTopicTag("ai", "ai");
    expect(result.affected).toBe(0);
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("F3 · 空白 src 抛 INVALID_INPUT", async () => {
    const { mergeTopicTag } = await import("@/lib/actions/tags");
    await expect(mergeTopicTag("  ", "dst")).rejects.toThrow(/INVALID_INPUT/);
  });

  it("F4 · 空白 dst 抛 INVALID_INPUT", async () => {
    const { mergeTopicTag } = await import("@/lib/actions/tags");
    await expect(mergeTopicTag("src", "")).rejects.toThrow(/INVALID_INPUT/);
  });

  it("F5 · 已存在 dst 时去重（避免 ['dst','dst']）", async () => {
    fakeEssays = [{ id: "e1", topicTags: ["ai", "ml"] }];
    const { mergeTopicTag } = await import("@/lib/actions/tags");
    const result = await mergeTopicTag("ai", "ml");
    expect(result.affected).toBe(1);
    expect(updateLog[0]?.topicTags).toEqual(["ml"]);
  });

  it("F6 · src trim 处理空白", async () => {
    fakeEssays = [{ id: "e1", topicTags: ["ai"] }];
    const { mergeTopicTag } = await import("@/lib/actions/tags");
    const result = await mergeTopicTag("  ai  ", "ml");
    expect(result.affected).toBe(1);
  });
});
