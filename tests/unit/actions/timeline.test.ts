import { describe, expect, it } from "vitest";
import type { ChapterConfig } from "@/lib/db/schema/site_config";
import { countWords, readingTime } from "@/lib/markdown";

describe("L1 · site-config schema 类型与 markdown", () => {
  it("F1 · siteConfig schema 导出 siteConfig 表", async () => {
    const mod = await import("@/lib/db/schema/site_config");
    expect(mod).toBeDefined();
    expect(mod).toHaveProperty("siteConfig");
  });

  it("F2 · ChapterConfig 类型推断", () => {
    const sample: ChapterConfig = {
      id: "01",
      name: "HERO",
      enabled: true,
      order: 1,
      required: true,
    };
    expect(sample.id).toBe("01");
  });

  it("F3 · countWords + readingTime 协同", () => {
    const words = countWords("这是一段测试文字");
    const minutes = readingTime(words);
    expect(words).toBeGreaterThan(0);
    expect(minutes).toBeGreaterThanOrEqual(1);
  });
});
