import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
// 直接读 JSON，避免 next-intl server 上下文
import zh from "@/messages/zh.json";

// 本轮 i18n 改造新增/修改的 key，必须 zh/en 都存在
const REQUIRED_KEYS = [
  // sidebar 新增
  "admin.sidebar_tags",
  "admin.sidebar_logs",
  // logs 页新增
  "admin.logs_title",
  "admin.logs_col_time",
  "admin.logs_col_action",
  "admin.logs_col_target",
  "admin.logs_col_summary",
  // dashboard 改造
  "dashboard.last_activity",
  "dashboard.section_kpi",
  "dashboard.kpi_published",
  "dashboard.kpi_agents_active",
  "dashboard.kpi_agents_coming",
  // audit 枚举映射
  "audit.action.create",
  "audit.action.update",
  "audit.action.delete",
  "audit.action.login",
  "audit.action.logout",
  "audit.target.user",
  "audit.target.essay",
  "audit.target.agent",
  "audit.target.asset",
  "audit.target.asset_link",
  "audit.target.tag",
  "audit.target.timeline_node",
  "audit.target.site_config",
  // 第二轮：编辑器与列表页
  "admin.essay.field.sn",
  "admin.essay.field.title",
  "admin.essay.col.title",
  "admin.essay.filter.all",
  "admin.agent.field.name",
  "admin.agent.col.status",
  "admin.agent.add_spec",
  "admin.timeline_node.col.version",
  "admin.timeline_node.set_as_now",
  "admin.timeline_node.now_badge",
  "admin.settings_form.field.site_name",
  "admin.settings_form.save",
  "admin.tags_page.subtitle",
  "admin.assets_page.subtitle",
  "admin.enum.essay_type.essay",
  "admin.enum.essay_status.draft",
  "admin.enum.agent_status.active",
  "admin.enum.click_target.internal",
  "admin.enum.launch_type.external",
  "admin.enum.timeline_type.now",
  "admin.common.create",
  "admin.common.saving",
  "admin.common.saved",
];

// next-intl 不允许空字符串 value（会渲染为空，等同缺 key）
function getValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

describe("L1 · i18n 字典结构与一致性", () => {
  it("F1 · 所有本轮 REQUIRED_KEYS 在 zh.json 中存在且非空", () => {
    for (const key of REQUIRED_KEYS) {
      const v = getValue(zh, key);
      expect(v, `zh.json 缺失或为空: ${key}`).toBeDefined();
      expect(typeof v, `zh.json ${key} 不是字符串`).toBe("string");
      expect((v as string).length, `zh.json ${key} 是空字符串`).toBeGreaterThan(0);
    }
  });

  it("F2 · 所有本轮 REQUIRED_KEYS 在 en.json 中存在且非空", () => {
    for (const key of REQUIRED_KEYS) {
      const v = getValue(en, key);
      expect(v, `en.json 缺失或为空: ${key}`).toBeDefined();
      expect(typeof v, `en.json ${key} 不是字符串`).toBe("string");
      expect((v as string).length, `en.json ${key} 是空字符串`).toBeGreaterThan(0);
    }
  });

  it("F3 · zh/en 顶层命名空间一致（结构对齐）", () => {
    const zhKeys = Object.keys(zh).sort();
    const enKeys = Object.keys(en).sort();
    expect(zhKeys).toEqual(enKeys);
  });

  it("F4 · admin 子命名空间 zh/en key 集合一致", () => {
    const zhAdmin = Object.keys((zh as { admin: object }).admin).sort();
    const enAdmin = Object.keys((en as { admin: object }).admin).sort();
    expect(zhAdmin).toEqual(enAdmin);
  });

  it("F5 · dashboard 子命名空间 zh/en key 集合一致", () => {
    const zhDash = Object.keys((zh as { dashboard: object }).dashboard).sort();
    const enDash = Object.keys((en as { dashboard: object }).dashboard).sort();
    expect(zhDash).toEqual(enDash);
  });

  it("F6 · audit.action 与 audit.target 在 zh/en 间的 key 集合一致", () => {
    const zhAction = Object.keys((zh as { audit: { action: object } }).audit.action).sort();
    const enAction = Object.keys((en as { audit: { action: object } }).audit.action).sort();
    expect(zhAction).toEqual(enAction);
    const zhTarget = Object.keys((zh as { audit: { target: object } }).audit.target).sort();
    const enTarget = Object.keys((en as { audit: { target: object } }).audit.target).sort();
    expect(zhTarget).toEqual(enTarget);
  });

  it("F7 · audit.action 覆盖代码中所有 writeAuditLog 的 action 枚举", () => {
    // 已确认代码中实际使用的 5 个 action
    const codeActions = ["create", "update", "delete", "login", "logout"];
    const dictActions = Object.keys((zh as { audit: { action: object } }).audit.action);
    for (const a of codeActions) {
      expect(dictActions, `字典缺少 action: ${a}`).toContain(a);
    }
  });

  it("F8 · audit.target 覆盖代码中所有 writeAuditLog 的 targetType 枚举", () => {
    // 已确认代码中实际使用的 8 个 targetType
    const codeTargets = [
      "user",
      "essay",
      "agent",
      "asset",
      "asset_link",
      "tag",
      "timeline_node",
      "site_config",
    ];
    const dictTargets = Object.keys((zh as { audit: { target: object } }).audit.target);
    for (const t of codeTargets) {
      expect(dictTargets, `字典缺少 target: ${t}`).toContain(t);
    }
  });
});
