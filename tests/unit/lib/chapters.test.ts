import { describe, expect, it } from "vitest";
import { DEFAULT_CHAPTERS, renderStatsTemplate, resolveChapters } from "@/lib/site/chapters";

describe("L1 · 章节配置接线（resolveChapters）", () => {
  it("F1 · 无配置回退默认五章节", () => {
    expect(resolveChapters(null)).toEqual(DEFAULT_CHAPTERS);
    expect(resolveChapters([])).toEqual(DEFAULT_CHAPTERS);
  });

  it("F2 · enabled=false 的章节被过滤", () => {
    const result = resolveChapters([
      { id: "01", name: "HERO", order: 1, required: true, enabled: true },
      { id: "02", name: "WRITING", order: 2, required: false, enabled: false },
      { id: "03", name: "AGENTS", order: 3, required: false, enabled: true },
    ]);
    expect(result.map((c) => c.id)).toEqual(["01", "03"]);
  });

  it("F3 · order 决定渲染顺序", () => {
    const result = resolveChapters([
      { id: "05", name: "OUTRO", order: 5, required: true },
      { id: "01", name: "HERO", order: 1, required: true },
    ]);
    expect(result.map((c) => c.id)).toEqual(["01", "05"]);
  });

  it("F4 · 全部禁用时回退默认（防空白页）", () => {
    const result = resolveChapters([
      { id: "01", name: "HERO", order: 1, required: true, enabled: false },
    ]);
    expect(result).toEqual(DEFAULT_CHAPTERS);
  });
});

describe("L1 · globalStats 模板插值（renderStatsTemplate）", () => {
  it("F5 · 占位符替换为实时值", () => {
    expect(renderStatsTemplate("{agents_active} IN SERVICE", { agents_active: "6" })).toBe(
      "6 IN SERVICE",
    );
    expect(
      renderStatsTemplate("CAL.{calibre} · v{version}", { calibre: "04", version: "0.6" }),
    ).toBe("CAL.04 · v0.6");
  });

  it("F6 · 未知占位符保留原样（可见而非静默吞掉）", () => {
    expect(renderStatsTemplate("{unknown_key}", {})).toBe("{unknown_key}");
  });
});
