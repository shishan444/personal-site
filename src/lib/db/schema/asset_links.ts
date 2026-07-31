import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { assets } from "./assets";

export const assetLinks = pgTable(
  "asset_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id").notNull(),
    sourceType: varchar("source_type", { length: 32 }).notNull(),
    sourceId: uuid("source_id").notNull(),
    usage: varchar("usage", { length: 32 }).notNull(),
    caption: text("caption"),
    orderIndex: integer("order_index").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("asset_links_asset_idx").on(t.assetId),
    index("asset_links_source_idx").on(t.sourceType, t.sourceId, t.usage, t.orderIndex),
    foreignKey({
      name: "asset_links_asset_id_assets_id_fk",
      columns: [t.assetId],
      foreignColumns: [assets.id],
    }).onDelete("restrict"),
  ],
);

export const assetLinksRelations = relations(assetLinks, ({ one }) => ({
  asset: one(assets, {
    fields: [assetLinks.assetId],
    references: [assets.id],
  }),
}));
