import { describe, expect, it } from "vitest";

describe("L1 · 脚手架冒烟测试", () => {
  it("vitest 应能正常运行", () => {
    expect(1 + 1).toBe(2);
  });

  it("环境变量 NODE_ENV 应已定义", () => {
    expect(typeof process.env.NODE_ENV).toBe("string");
  });
});
