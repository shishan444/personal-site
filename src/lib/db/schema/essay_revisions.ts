import { relations } from "drizzle-orm";
import { foreignKey, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { revisionActionEnum } from "./_enums";
import { essays } from "./essays";
import { users } from "./users";

export const essayRevisions = pgTable(
  "essay_revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    essayId: uuid("essay_id").notNull(),
    snapshot: jsonb("snapshot").notNull(),
    action: revisionActionEnum("action").notNull(),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    foreignKey({
      name: "essay_revisions_essay_id_essays_id_fk",
      columns: [t.essayId],
      foreignColumns: [essays.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "essay_revisions_created_by_users_id_fk",
      columns: [t.createdBy],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
  ],
);

export const essayRevisionsRelations = relations(essayRevisions, ({ one }) => ({
  essay: one(essays, {
    fields: [essayRevisions.essayId],
    references: [essays.id],
  }),
  createdByUser: one(users, {
    fields: [essayRevisions.createdBy],
    references: [users.id],
  }),
}));
