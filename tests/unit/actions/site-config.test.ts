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

const updateLog: Array<{ setArg: Record<string, unknown>; whereArg?: unknown }> = [];

vi.mock("@/lib/db", () => {
  const chain = {
    update: vi.fn(() => ({
      set: vi.fn((setArg: Record<string, unknown>) => ({
        where: vi.fn(async (whereArg?: unknown) => {
          updateLog.push({ setArg, whereArg });
          return [];
        }),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => [{ id: 1, siteName: "Atelier" }]),
        })),
      })),
    })),
  };
  return { getDb: vi.fn(async () => chain), __chain: chain };
});

vi.mock("@/lib/audit", () => ({ writeAuditLog: auditMock }));
vi.mock("@/lib/auth", () => ({ getSession: vi.fn(async () => SESSION) }));
vi.mock("next/cache", () => ({ revalidatePath: revalidateMock }));

describe("L1 · site-config actions 契约（mock DB）", () => {
  beforeEach(() => {
    auditMock.mockReset();
    revalidateMock.mockReset();
    updateLog.length = 0;
  });

  it("F1 · updateSiteConfig 写入所有传入字段", async () => {
    const { updateSiteConfig } = await import("@/lib/actions/site-config");
    await updateSiteConfig({
      siteName: "New Name",
      subtitle: "new sub",
      currentVersion: "v0.5",
      currentCalibre: "05",
      heroSub: "new hero",
      rdMeta1: "m1",
      rdMeta2: "m2",
      theme: "warm-amber",
    });
    const last = updateLog.at(-1);
    expect(last?.setArg).toMatchObject({
      siteName: "New Name",
      subtitle: "new sub",
      currentVersion: "v0.5",
      currentCalibre: "05",
      heroSub: "new hero",
      rdMeta1: "m1",
      rdMeta2: "m2",
      theme: "warm-amber",
    });
    expect(last?.setArg.updatedAt).toBeInstanceOf(Date);
  });

  it("F2 · updateSiteConfig 写入 subdialsConfig / chaptersConfig / globalStats JSON 字段", async () => {
    const { updateSiteConfig } = await import("@/lib/actions/site-config");
    await updateSiteConfig({
      subdialsConfig: {
        lu: { enabled: true },
        ru: { enabled: true, tickCount: 5 },
        ld: { enabled: false },
        rd: { enabled: true, meta1: "v0.5", meta2: "NEXT" },
      },
      chaptersConfig: [{ id: "01", name: "HERO", enabled: true, order: 1, required: true }],
      globalStats: { inService: "x", inBeta: "y", writing: "z", calibre: "05" },
    });
    const last = updateLog.at(-1);
    expect(last?.setArg.subdialsConfig).toMatchObject({ lu: { enabled: true } });
    expect(Array.isArray(last?.setArg.chaptersConfig)).toBe(true);
    expect(last?.setArg.globalStats).toMatchObject({ calibre: "05" });
  });

  it("F3 · updateSiteConfig audit metadata.fields 记录变更字段名列表", async () => {
    const { updateSiteConfig } = await import("@/lib/actions/site-config");
    await updateSiteConfig({ siteName: "x", theme: "y" });
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        targetType: "site_config",
        metadata: { fields: ["siteName", "theme"] },
      }),
    );
  });

  it("F4 · getSiteConfigForAdmin 返回 id=1 单行", async () => {
    const { getSiteConfigForAdmin } = await import("@/lib/actions/site-config");
    const row = await getSiteConfigForAdmin();
    expect(row?.id).toBe(1);
  });
});

describe("L1 · site-config actions 反向", () => {
  it("F5 · updateSiteConfig 未登录抛 UNAUTHORIZED", async () => {
    const authMod = await import("@/lib/auth");
    const original = (authMod.getSession as ReturnType<typeof vi.fn>).getMockImplementation();
    (authMod.getSession as ReturnType<typeof vi.fn>).mockImplementation(async () => null);
    const { updateSiteConfig } = await import("@/lib/actions/site-config");
    await expect(updateSiteConfig({ siteName: "x" })).rejects.toThrow(/UNAUTHORIZED/);
    if (original) (authMod.getSession as ReturnType<typeof vi.fn>).mockImplementation(original);
  });
});
