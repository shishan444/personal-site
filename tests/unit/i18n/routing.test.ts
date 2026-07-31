import { describe, expect, it } from "vitest";
import { defaultLocale, type Locale, locales, routing } from "@/i18n/routing";

describe("L1 · i18n routing 配置", () => {
  it("F1 · locales 应为 ['zh', 'en']", () => {
    expect(locales).toEqual(["zh", "en"]);
  });

  it("F2 · defaultLocale 应为 'zh'", () => {
    expect(defaultLocale).toBe("zh");
  });

  it("F3 · routing.locales 与 export 一致", () => {
    expect(routing.locales).toEqual(locales);
    expect(routing.defaultLocale).toBe(defaultLocale);
  });

  it("F4 · localePrefix 应为 'always'", () => {
    expect(routing.localePrefix).toBe("always");
  });

  it("F5 · Locale type 推断正确", () => {
    const l: Locale = "zh";
    const l2: Locale = "en";
    expect([l, l2]).toEqual(["zh", "en"]);
  });
});
