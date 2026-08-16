import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** 对比度守护：spec 7.2 要求正文与标签可读色 ≥4.5:1（ink-soft 曾以 2.67:1 违规被审计）。 */
function luminance(hex: string): number {
  const channel = [1, 3, 5]
    .map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2];
}

function contrastRatio(foreground: string, background: string): number {
  const l1 = luminance(foreground);
  const l2 = luminance(background);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function readToken(name: string): string {
  const css = readFileSync(path.resolve(process.cwd(), "src/app/globals.css"), "utf-8");
  const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --color-${name} not found`);
  return m[1].toLowerCase();
}

describe("L1 · 对比度守护（WCAG AA ≥4.5:1）", () => {
  it("F1 · 文字色 token 在 bg / bg-2 上全部达标", () => {
    const bg = readToken("bg");
    const bg2 = readToken("bg-2");
    for (const name of ["ink", "ink-mute", "ink-soft"]) {
      const fg = readToken(name);
      expect(contrastRatio(fg, bg), `${name} on bg`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(fg, bg2), `${name} on bg-2`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("F2 · ink-soft 与 ink-mute 保持可辨层级（mute 更亮）", () => {
    expect(luminance(readToken("ink-mute"))).toBeGreaterThan(luminance(readToken("ink-soft")));
  });
});
