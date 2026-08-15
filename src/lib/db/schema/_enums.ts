import { pgEnum } from "drizzle-orm/pg-core";

export const languageEnum = pgEnum("language", ["zh", "en"]);
export const essayStatusEnum = pgEnum("essay_status", ["draft", "published", "archived"]);
export const essayTypeTagEnum = pgEnum("essay_type_tag", ["essay", "note", "tutorial"]);
export const agentStatusEnum = pgEnum("agent_status", ["active", "beta", "archived", "coming"]);
export const clickTargetEnum = pgEnum("click_target", ["internal", "external"]);
export const launchTypeEnum = pgEnum("launch_type", ["external", "iframe", "modal"]);
export const modalSizeEnum = pgEnum("modal_size", ["small", "medium", "large", "full"]);
export const timelineTypeEnum = pgEnum("timeline_type", [
  "genesis",
  "first",
  "normal",
  "now",
  "future",
]);
export const userRoleEnum = pgEnum("user_role", ["owner", "admin", "editor", "author", "viewer"]);
export const revisionActionEnum = pgEnum("revision_action", [
  "created",
  "edited",
  "published",
  "archived",
  "restored",
]);
export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "publish",
  "archive",
  "login",
  "logout",
  "restore",
]);
