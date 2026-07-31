import { sql } from "drizzle-orm";
import {
  boolean,
  date,
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
import { timelineTypeEnum } from "./_enums";

export interface TimelineChange {
  id: string;
  type: "add" | "mod" | "del";
  text: string;
}

export const timelineNodes = pgTable(
  "timeline_nodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    version: varchar("version", { length: 16 }).notNull(),
    name: text("name").notNull(),
    desc: text("desc").notNull(),
    type: timelineTypeEnum("type").notNull(),
    date: date("date").notNull(),
    changes: jsonb("changes").$type<TimelineChange[]>().default([]).notNull(),
    filesChanged: integer("files_changed"),
    linesAdd: integer("lines_add"),
    linesDel: integer("lines_del"),
    relatedAgentIds: jsonb("related_agent_ids").$type<string[]>().default([]).notNull(),
    isNow: boolean("is_now").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("timeline_date_idx").on(t.date),
    uniqueIndex("timeline_one_now_idx").on(t.isNow).where(sql`"is_now" = true`),
  ],
);
