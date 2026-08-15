import { relations, sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { essayStatusEnum, essayTypeTagEnum, languageEnum } from "./_enums";
import { agents } from "./agents";
import { assets } from "./assets";
import { essayRevisions } from "./essay_revisions";
import { users } from "./users";

export const essays = pgTable(
  "essays",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sn: varchar("sn", { length: 16 }).notNull(),
    lang: languageEnum("lang").notNull(),
    translationGroupId: uuid("translation_group_id").notNull(),
    title: text("title").notNull(),
    deck: text("deck").notNull(),
    body: text("body").notNull(),
    typeTag: essayTypeTagEnum("type_tag").notNull(),
    topicTags: jsonb("topic_tags").$type<string[]>().default([]).notNull(),
    status: essayStatusEnum("status").default("draft").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    slug: varchar("slug", { length: 256 }),
    ogTitle: text("og_title"),
    ogDescription: text("og_description"),
    ogImageAssetId: uuid("og_image_asset_id"),
    relatedAgentId: uuid("related_agent_id"),
    isPinned: boolean("is_pinned").default(false).notNull(),
    allowComment: boolean("allow_comment").default(true).notNull(),
    words: integer("words").default(0).notNull(),
    readMinutes: integer("read_minutes").default(0).notNull(),
    authorId: uuid("author_id").notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("essays_sn_idx").on(t.sn),
    uniqueIndex("essays_slug_idx").on(t.slug).where(sql`"slug" IS NOT NULL`),
    index("essays_status_published_idx").on(t.status, t.publishedAt),
    index("essays_translation_idx").on(t.translationGroupId, t.lang),
    index("essays_topic_tags_idx").using("gin", t.topicTags),
    index("essays_type_tag_idx").on(t.typeTag),
    index("essays_author_idx").on(t.authorId),
    foreignKey({
      name: "essays_og_image_asset_id_assets_id_fk",
      columns: [t.ogImageAssetId],
      foreignColumns: [assets.id],
    }).onDelete("set null"),
    foreignKey({
      name: "essays_related_agent_id_agents_id_fk",
      columns: [t.relatedAgentId],
      foreignColumns: [agents.id],
    }).onDelete("set null"),
    foreignKey({
      name: "essays_author_id_users_id_fk",
      columns: [t.authorId],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
  ],
);

export const essaysRelations = relations(essays, ({ one, many }) => ({
  author: one(users, {
    fields: [essays.authorId],
    references: [users.id],
  }),
  relatedAgent: one(agents, {
    fields: [essays.relatedAgentId],
    references: [agents.id],
  }),
  ogImage: one(assets, {
    fields: [essays.ogImageAssetId],
    references: [assets.id],
    relationName: "essay_og_image",
  }),
  revisions: many(essayRevisions),
}));
