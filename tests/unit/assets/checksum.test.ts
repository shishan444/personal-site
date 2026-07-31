import { describe, expect, it } from "vitest";
import { computeChecksum, shortChecksum } from "@/lib/assets/checksum";

describe("L1 · checksum", () => {
  it("F1 · SHA-256 输出 64 位 hex", () => {
    const h = computeChecksum(Buffer.from("hello"));
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });

  it("F2 · 相同输入相同 hash（确定性）", () => {
    const a = computeChecksum(Buffer.from("atelier"));
    const b = computeChecksum(Buffer.from("atelier"));
    expect(a).toBe(b);
  });

  it("F3 · 不同输入不同 hash", () => {
    const a = computeChecksum(Buffer.from("foo"));
    const b = computeChecksum(Buffer.from("bar"));
    expect(a).not.toBe(b);
  });

  it("F4 · 知识向量（known answer）", () => {
    expect(computeChecksum(Buffer.from(""))).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("F5 · shortChecksum 截断为 12", () => {
    const s = shortChecksum(Buffer.from("hello"));
    expect(s).toHaveLength(12);
  });
});
