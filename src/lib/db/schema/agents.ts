import { relations } from "drizzle-orm";
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
import { agentStatusEnum, clickTargetEnum, launchTypeEnum, modalSizeEnum } from "./_enums";
import { assets } from "./assets";
import { essays } from "./essays";

export interface AgentSpec {
  id: string;
  label: string;
  value: string;
  isPrimary: boolean;
}

export const agents = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sn: varchar("sn", { length: 16 }).notNull(),
    name: text("name").notNull(),
    desc: text("desc").notNull(),
    longDesc: text("long_desc"),
    status: agentStatusEnum("status").default("coming").notNull(),
    specs: jsonb("specs").$type<AgentSpec[]>().default([]).notNull(),
    cardImageAssetId: uuid("card_image_asset_id"),
    clickTarget: clickTargetEnum("click_target").default("internal").notNull(),
    launchType: launchTypeEnum("launch_type").default("external").notNull(),
    launchUrl: text("launch_url"),
    modalSize: modalSizeEnum("modal_size"),
    order: integer("order").notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("agents_sn_idx").on(t.sn),
    uniqueIndex("agents_order_idx").on(t.order),
    index("agents_status_idx").on(t.status),
    foreignKey({
      name: "agents_card_image_asset_id_assets_id_fk",
      columns: [t.cardImageAssetId],
      foreignColumns: [assets.id],
    }).onDelete("set null"),
  ],
);

export const agentsRelations = relations(agents, ({ many, one }) => ({
  cardImage: one(assets, {
    fields: [agents.cardImageAssetId],
    references: [assets.id],
    relationName: "agent_card_image",
  }),
  essays: many(essays),
}));
