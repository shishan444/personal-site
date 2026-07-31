import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import zh from "@/messages/zh.json";

function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...collectKeys(v as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

describe("L1 · i18n messages 完整性", () => {
  const zhKeys = collectKeys(zh);
  const enKeys = collectKeys(en);

  it("F1 · zh.json 应有 ≥ 120 个 key", () => {
    expect(zhKeys.length).toBeGreaterThanOrEqual(120);
  });

  it("F2 · en.json 应有 ≥ 120 个 key", () => {
    expect(enKeys.length).toBeGreaterThanOrEqual(120);
  });

  it("F3 · zh 和 en 的 key 集合应完全一致", () => {
    const zhSet = new Set(zhKeys);
    const enSet = new Set(enKeys);
    const missingInEn = zhKeys.filter((k) => !enSet.has(k));
    const missingInZh = enKeys.filter((k) => !zhSet.has(k));
    expect({ missingInEn, missingInZh }).toEqual({ missingInEn: [], missingInZh: [] });
  });

  it("F4 · common.* 核心动作 key 全部存在", () => {
    const requiredCommonButtons = [
      "save",
      "cancel",
      "delete",
      "edit",
      "create",
      "publish",
      "archive",
      "search",
    ];
    for (const btn of requiredCommonButtons) {
      expect(zhKeys).toContain(`common.button.${btn}`);
      expect(enKeys).toContain(`common.button.${btn}`);
    }
  });

  it("F5 · 状态徽章 key 覆盖 agent.status.*", () => {
    for (const s of ["active", "beta", "archived", "coming"]) {
      expect(zhKeys).toContain(`agent.status_${s}`);
    }
  });

  it("F6 · auth 关键 key 覆盖", () => {
    for (const k of [
      "login_title",
      "login_email",
      "login_password",
      "login_submit",
      "login_invalid",
      "change_password_title",
    ]) {
      expect(zhKeys).toContain(`auth.${k}`);
    }
  });

  it("F7 · hero meta ICU 复数（en）正确", () => {
    expect(en.hero.meta_writing).toContain("plural");
    expect(en.hero.meta_writing).toMatch(/\{count[,}]/);
  });
});
