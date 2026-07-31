import { describe, expect, it } from "vitest";
import { countWords, readingTime, renderMarkdownToHtml } from "@/lib/markdown";

describe("L1 · markdown 工具", () => {
  it("F1 · countWords 中文计字", () => {
    expect(countWords("你好世界")).toBe(4);
  });

  it("F2 · countWords 英文按词", () => {
    expect(countWords("hello world from atelier")).toBe(4);
  });

  it("F3 · countWords 中英混合", () => {
    const w = countWords("AI Agent 是 21 世纪的新工具");
    expect(w).toBeGreaterThan(7);
  });

  it("F4 · countWords 去除代码块", () => {
    const w = countWords("Hello\n```\nthis is code not counted\n```\nWorld");
    expect(w).toBe(2);
  });

  it("F5 · countWords 去除图片/链接 markdown", () => {
    const w = countWords("![alt](url.png) and [link](url) and text");
    expect(w).toBeLessThan(8);
  });

  it("F6 · countWords 空字符串", () => {
    expect(countWords("")).toBe(0);
  });

  it("F7 · readingTime 按 220wpm", () => {
    expect(readingTime(220)).toBe(1);
    expect(readingTime(440)).toBe(2);
    expect(readingTime(50)).toBe(1);
  });

  it("F8 · readingTime 至少 1 分钟", () => {
    expect(readingTime(0)).toBe(1);
  });

  it("F9 · renderMarkdownToHtml 输出 HTML", async () => {
    const html = await renderMarkdownToHtml("# Title\n\nbody text");
    expect(html).toContain("<h1>");
    expect(html).toContain("Title");
    expect(html).toContain("body text");
  });

  it("F10 · renderMarkdownToHtml 支持 GFM", async () => {
    const html = await renderMarkdownToHtml("| a | b |\n| - | - |\n| 1 | 2 |");
    expect(html).toContain("<table>");
  });
});
