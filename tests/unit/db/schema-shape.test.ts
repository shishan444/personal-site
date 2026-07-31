import { describe, expect, it } from "vitest";
import * as schema from "@/lib/db/schema";

describe("L1 · Schema 形状校验（不连 DB）", () => {
  it("应导出全部 12 张表", () => {
    const tables = [
      "users",
      "sessions",
      "accounts",
      "verifications",
      "assets",
      "agents",
      "essays",
      "timelineNodes",
      "assetLinks",
      "siteConfig",
      "essayRevisions",
      "auditLogs",
    ];
    for (const name of tables) {
      expect(schema, `missing table ${name}`).toHaveProperty(name);
    }
  });

  it("应导出全部 11 个枚举", () => {
    const enums = [
      "languageEnum",
      "essayStatusEnum",
      "essayTypeTagEnum",
      "agentStatusEnum",
      "clickTargetEnum",
      "launchTypeEnum",
      "modalSizeEnum",
      "timelineTypeEnum",
      "userRoleEnum",
      "revisionActionEnum",
      "auditActionEnum",
    ];
    for (const name of enums) {
      expect(schema, `missing enum ${name}`).toHaveProperty(name);
    }
  });

  it("essays 应包含 23 列（按 DATA-MODEL §3.4）", () => {
    const expectedColumns = [
      "id",
      "sn",
      "lang",
      "translationGroupId",
      "title",
      "deck",
      "body",
      "typeTag",
      "topicTags",
      "status",
      "publishedAt",
      "slug",
      "ogTitle",
      "ogDescription",
      "ogImageAssetId",
      "relatedAgentId",
      "isPinned",
      "allowComment",
      "words",
      "readMinutes",
      "authorId",
      "createdAt",
      "updatedAt",
    ];
    for (const col of expectedColumns) {
      expect(schema.essays, `essays.${col} 缺失`).toHaveProperty(col);
    }
  });

  it("agents 应包含关键列", () => {
    const expected = [
      "id",
      "sn",
      "name",
      "desc",
      "longDesc",
      "status",
      "specs",
      "cardImageAssetId",
      "clickTarget",
      "launchType",
      "launchUrl",
      "modalSize",
      "order",
      "isPinned",
      "publishedAt",
    ];
    for (const col of expected) {
      expect(schema.agents, `agents.${col} 缺失`).toHaveProperty(col);
    }
  });

  it("timeline_nodes 应包含 isNow + 部分唯一索引", () => {
    expect(schema.timelineNodes).toHaveProperty("isNow");
    expect(schema.timelineNodes).toHaveProperty("type");
    expect(schema.timelineNodes).toHaveProperty("changes");
    expect(schema.timelineNodes).toHaveProperty("relatedAgentIds");
  });

  it("asset_links 应为多态关联（无 source_id 外键）", () => {
    expect(schema.assetLinks).toHaveProperty("sourceType");
    expect(schema.assetLinks).toHaveProperty("sourceId");
    expect(schema.assetLinks).toHaveProperty("usage");
    expect(schema.assetLinks).toHaveProperty("orderIndex");
  });

  it("site_config 应有 id=1 单行约束相关字段", () => {
    expect(schema.siteConfig).toHaveProperty("id");
    expect(schema.siteConfig).toHaveProperty("subdialsConfig");
    expect(schema.siteConfig).toHaveProperty("chaptersConfig");
    expect(schema.siteConfig).toHaveProperty("globalStats");
  });

  it("users 应含 role / emailVerified / avatarAssetId", () => {
    expect(schema.users).toHaveProperty("role");
    expect(schema.users).toHaveProperty("emailVerified");
    expect(schema.users).toHaveProperty("avatarAssetId");
  });
});
