import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { assets } from "./assets";

export interface SubdialsConfig {
  lu: { enabled: boolean };
  ru: { enabled: boolean; tickCount: number };
  ld: { enabled: boolean };
  rd: { enabled: boolean; meta1: string; meta2: string };
}

export interface ChapterConfig {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  required: boolean;
}

export interface GlobalStats {
  inService: string;
  inBeta: string;
  writing: string;
  calibre: string;
}

export const siteConfig = pgTable(
  "site_config",
  {
    id: integer("id").primaryKey().default(1),
    siteName: varchar("site_name", { length: 64 }).default("Atelier").notNull(),
    subtitle: varchar("subtitle", { length: 256 }).notNull(),
    currentVersion: varchar("current_version", { length: 16 }).default("v0.4").notNull(),
    currentCalibre: varchar("current_calibre", { length: 8 }).default("04").notNull(),
    heroSub: text("hero_sub").notNull(),
    logoAssetId: uuid("logo_asset_id"),
    faviconAssetId: uuid("favicon_asset_id"),
    rdMeta1: varchar("rd_meta_1", { length: 256 }).notNull(),
    rdMeta2: varchar("rd_meta_2", { length: 256 }).notNull(),
    subdialsConfig: jsonb("subdials_config").$type<SubdialsConfig>().notNull(),
    chaptersConfig: jsonb("chapters_config").$type<ChapterConfig[]>().notNull(),
    globalStats: jsonb("global_stats").$type<GlobalStats>().notNull(),
    theme: varchar("theme", { length: 32 }).default("warm-amber").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check("site_config_single_row", sql`"id" = 1`),
    foreignKey({
      name: "site_config_logo_asset_id_assets_id_fk",
      columns: [t.logoAssetId],
      foreignColumns: [assets.id],
    }).onDelete("set null"),
    foreignKey({
      name: "site_config_favicon_asset_id_assets_id_fk",
      columns: [t.faviconAssetId],
      foreignColumns: [assets.id],
    }).onDelete("set null"),
  ],
);
