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

describe("L4+ · 关键链路回归烟雾（审查修复锁定）", () => {
  it("F4 · middleware 无 cookie 访问 /admin 应重定向登录页", async () => {
    const { middleware } = await import("@/middleware");
    const { NextRequest } = await import("next/server");
    const res = middleware(new NextRequest("http://localhost/zh/admin"));
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.headers.get("location")).toContain("/zh/login");
  });

  it("F5 · middleware 携带 atelier_session cookie 访问 /admin 不应被踢回登录页", async () => {
    const { middleware } = await import("@/middleware");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/zh/admin", {
      headers: { cookie: "atelier_session=test-token" },
    });
    const res = middleware(req);
    expect(res.headers.get("location") ?? "").not.toContain("/login");
  });

  it("F6 · markdown 代码块应经 Shiki 高亮", async () => {
    const { renderMarkdownToHtml } = await import("@/lib/markdown");
    const html = await renderMarkdownToHtml("```ts\nconst a = 1;\n```");
    expect(html).toContain("shiki");
  });

  it("F7 · uploads 路由拒绝路径穿越", async () => {
    const { GET } = await import("@/app/uploads/[...path]/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/uploads/x"), {
      params: Promise.resolve({ path: ["..", "..", "etc", "passwd"] }),
    });
    expect(res.status).toBe(403);
  });

  it("F8 · uploads 路由对不存在的文件返回 404", async () => {
    const { GET } = await import("@/app/uploads/[...path]/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost/uploads/nope/missing.webp"), {
      params: Promise.resolve({ path: ["nope", "missing.webp"] }),
    });
    expect(res.status).toBe(404);
  });

  it("F9 · getDb 门面存在（DATABASE_URL 决定 PG/PGlite）", async () => {
    const mod = await import("@/lib/db");
    expect(typeof mod.getDb).toBe("function");
  });
});
