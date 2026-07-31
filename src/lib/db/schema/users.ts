import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./_enums";
import { accounts } from "./accounts";
import { essays } from "./essays";
import { sessions } from "./sessions";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 256 }).notNull(),
    name: varchar("name", { length: 64 }).notNull(),
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").default("owner").notNull(),
    avatarAssetId: uuid("avatar_asset_id"),
    emailVerified: boolean("email_verified").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  essays: many(essays),
}));
