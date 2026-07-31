import { relations } from "drizzle-orm";
import {
  bigint,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { assetLinks } from "./asset_links";
import { users } from "./users";

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    filename: varchar("filename", { length: 256 }).notNull(),
    originalFilename: varchar("original_filename", { length: 256 }).notNull(),
    mimeType: varchar("mime_type", { length: 64 }).notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    width: integer("width"),
    height: integer("height"),
    storagePath: text("storage_path").notNull(),
    checksum: varchar("checksum", { length: 64 }).notNull(),
    uploadedBy: uuid("uploaded_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("assets_checksum_idx").on(t.checksum),
    index("assets_mime_idx").on(t.mimeType),
    index("assets_uploader_idx").on(t.uploadedBy),
    foreignKey({
      name: "assets_uploaded_by_users_id_fk",
      columns: [t.uploadedBy],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
  ],
);

export const assetsRelations = relations(assets, ({ many, one }) => ({
  uploader: one(users, {
    fields: [assets.uploadedBy],
    references: [users.id],
  }),
  links: many(assetLinks),
}));
