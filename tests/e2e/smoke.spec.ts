import { describe, expect, it } from "vitest";

describe("L4 · SEO + 部署 烟雾测试", () => {
  it("F1 · robots.ts 应导出规则", async () => {
    const mod = await import("@/app/robots");
    const result = mod.default();
    expect(result.sitemap).toContain("/sitemap.xml");
    expect(Array.isArray(result.rules) ? result.rules.length : 1).toBeGreaterThan(0);
  });

  it("F2 · manifest.ts 应返回 PWA manifest", async () => {
    const mod = await import("@/app/manifest");
    const m = mod.default();
    expect(m.name).toBe("ATELIER");
    expect(m.theme_color).toBe("#E8A33C");
    expect(m.background_color).toBe("#0A0908");
  });

  it("F3 · sitemap 应为 async function", async () => {
    const mod = await import("@/app/sitemap");
    expect(typeof mod.default).toBe("function");
  });
});
