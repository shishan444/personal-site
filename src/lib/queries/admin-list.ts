import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { agents, essays } from "@/lib/db/schema";

export interface AdminEssayRow {
  id: string;
  sn: string;
  title: string;
  status: "draft" | "published" | "archived";
  typeTag: "essay" | "note" | "tutorial";
  lang: "zh" | "en";
  words: number;
  updatedAt: Date;
  isPinned: boolean;
  slug: string | null;
}

export async function listEssaysForAdmin(opts?: {
  status?: "draft" | "published" | "archived";
  typeTag?: "essay" | "note" | "tutorial";
}): Promise<AdminEssayRow[]> {
  const db = await getDb();
  const conditions = [];
  if (opts?.status) conditions.push(eq(essays.status, opts.status));
  if (opts?.typeTag) conditions.push(eq(essays.typeTag, opts.typeTag));

  const rows =
    conditions.length > 0
      ? await db
          .select()
          .from(essays)
          .where(and(...conditions))
          .orderBy(desc(essays.updatedAt))
      : await db.select().from(essays).orderBy(desc(essays.updatedAt));

  return rows.map((e) => ({
    id: e.id,
    sn: e.sn,
    title: e.title.replace(/<\/?em>/g, ""),
    status: e.status,
    typeTag: e.typeTag,
    lang: e.lang,
    words: e.words,
    updatedAt: e.updatedAt,
    isPinned: e.isPinned,
    slug: e.slug,
  }));
}

export interface AdminAgentRow {
  id: string;
  sn: string;
  name: string;
  status: "active" | "beta" | "archived" | "coming";
  order: number;
  specsCount: number;
  updatedAt: Date;
}

export async function listAgentsForAdmin(): Promise<AdminAgentRow[]> {
  const db = await getDb();
  const rows = await db.select().from(agents).orderBy(agents.order);
  return rows.map((a) => ({
    id: a.id,
    sn: a.sn,
    name: a.name.replace(/<\/?em>/g, ""),
    status: a.status,
    order: a.order,
    specsCount: a.specs.length,
    updatedAt: a.updatedAt,
  }));
}

export async function getEssayForEdit(id: string) {
  const db = await getDb();
  const row = (await db.select().from(essays).where(eq(essays.id, id)).limit(1))[0];
  if (!row) return null;
  return row;
}

export async function getAgentForEdit(id: string) {
  const db = await getDb();
  const row = (await db.select().from(agents).where(eq(agents.id, id)).limit(1))[0];
  if (!row) return null;
  return row;
}

export interface EssayRevisionRow {
  id: string;
  action: "created" | "edited" | "published" | "archived" | "restored";
  title: string;
  words: number;
  createdAt: Date;
}

export async function listEssayRevisions(essayId: string): Promise<EssayRevisionRow[]> {
  const db = await getDb();
  const { essayRevisions } = await import("@/lib/db/schema");
  const rows = await db
    .select()
    .from(essayRevisions)
    .where(eq(essayRevisions.essayId, essayId))
    .orderBy(desc(essayRevisions.createdAt))
    .limit(50);
  return rows.map((r) => {
    const snap = r.snapshot as { title?: unknown; words?: unknown };
    return {
      id: r.id,
      action: r.action,
      title: typeof snap.title === "string" ? snap.title : "（无标题）",
      words: typeof snap.words === "number" ? snap.words : 0,
      createdAt: r.createdAt,
    };
  });
}
