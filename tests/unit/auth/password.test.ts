import { describe, expect, it } from "vitest";
import { hashPassword, validatePasswordInput, verifyPassword } from "@/lib/auth/password";

describe("L1 · 密码哈希（password.ts）", () => {
  it("F1 · hashPassword 应产出 argon2id 格式", async () => {
    const hash = await hashPassword("mySecret123");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(hash.length).toBeGreaterThan(80);
  });

  it("F1.2 · 不同密码应生成不同 hash（含盐）", async () => {
    const h1 = await hashPassword("same-password");
    const h2 = await hashPassword("same-password");
    expect(h1).not.toBe(h2);
  });

  it("F2 · verifyPassword 正向", async () => {
    const hash = await hashPassword("correct horse battery");
    const ok = await verifyPassword(hash, "correct horse battery");
    expect(ok).toBe(true);
  });

  it("F2.2 · verifyPassword 反向（错误密码）", async () => {
    const hash = await hashPassword("right");
    const ok = await verifyPassword(hash, "wrong");
    expect(ok).toBe(false);
  });

  it("F2.3 · verifyPassword 反向（无效 hash）", async () => {
    const ok = await verifyPassword("not-a-real-hash", "anything");
    expect(ok).toBe(false);
  });

  it("F2.4 · placeholder hash 应被拒绝（首次登录强制改密）", async () => {
    const ok = await verifyPassword("$argon2id$CHANGE_ME_ON_FIRST_LOGIN", "anything");
    expect(ok).toBe(false);
  });
});

describe("L1 · 密码输入校验（validatePasswordInput）", () => {
  it("F3.1 · 短于 8 位应报错", () => {
    expect(validatePasswordInput("abc123")).toBe("密码至少 8 位");
  });

  it("F3.2 · 8 位应通过", () => {
    expect(validatePasswordInput("abc12345")).toBeNull();
  });

  it("F3.3 · 超过 128 位应报错", () => {
    const long = "a".repeat(129);
    expect(validatePasswordInput(long)).toBe("密码最多 128 位");
  });

  it("F3.4 · 128 位应通过", () => {
    const ok = "a".repeat(128);
    expect(validatePasswordInput(ok)).toBeNull();
  });

  it("F3.5 · 空密码应报错", () => {
    expect(validatePasswordInput("")).toBe("密码至少 8 位");
  });
});
