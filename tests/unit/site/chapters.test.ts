import { describe, expect, it } from "vitest";
import { chapterMeta, DEFAULT_CHAPTERS } from "@/lib/site/chapters";

describe("L1 · chapters 配置", () => {
  it("F1 · DEFAULT_CHAPTERS 应有 5 个章节", () => {
    expect(DEFAULT_CHAPTERS).toHaveLength(5);
  });

  it("F2 · HERO + OUTRO 应 required=true", () => {
    const hero = DEFAULT_CHAPTERS.find((c) => c.name === "HERO");
    const outro = DEFAULT_CHAPTERS.find((c) => c.name === "OUTRO");
    expect(hero?.required).toBe(true);
    expect(outro?.required).toBe(true);
  });

  it("F3 · order 应唯一递增", () => {
    const orders = DEFAULT_CHAPTERS.map((c) => c.order);
    expect(new Set(orders).size).toBe(orders.length);
    expect([...orders].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it("F4 · chapterMeta 返回正确 index", () => {
    const meta = chapterMeta(DEFAULT_CHAPTERS, "03");
    expect(meta).toEqual({ id: "03", name: "AGENTS", index: 3, total: 5 });
  });

  it("F5 · chapterMeta 不存在返回 null", () => {
    expect(chapterMeta(DEFAULT_CHAPTERS, "99")).toBeNull();
  });

  it("F6 · id 应为 2 位数字字符串", () => {
    for (const c of DEFAULT_CHAPTERS) {
      expect(c.id).toMatch(/^\d{2}$/);
    }
  });
});
