import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { auditActionEnum } from "./_enums";
import { users } from "./users";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id"),
    action: auditActionEnum("action").notNull(),
    targetType: varchar("target_type", { length: 32 }).notNull(),
    targetId: uuid("target_id"),
    summary: text("summary"),
    metadata: jsonb("metadata"),
    ip: varchar("ip", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("audit_logs_user_idx").on(t.userId),
    index("audit_logs_target_idx").on(t.targetType, t.targetId),
    index("audit_logs_created_idx").on(t.createdAt),
    foreignKey({
      name: "audit_logs_user_id_users_id_fk",
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("set null"),
  ],
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
