import { and, count, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { agents, auditLogs, essays, timelineNodes } from "@/lib/db/schema";

export interface AdminDashboardData {
  kpi: {
    agents: number;
    essays: number;
    essaysDraft: number;
    essaysPublished: number;
    agentsActive: number;
    agentsComing: number;
    timelineNodes: number;
  };
  recentActivity: {
    id: string;
    action: string;
    targetType: string;
    summary: string | null;
    createdAt: Date;
  }[];
  todo: {
    draftEssays: { id: string; sn: string; title: string; updatedAt: Date }[];
    incompleteAgents: {
      id: string;
      sn: string;
      name: string;
      issue: string;
    }[];
  };
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const db = await getDb();
  const [allAgents, allEssays, allTimeline, recentLogs, drafts] = await Promise.all([
    db.select().from(agents).where(isNull(agents.deletedAt)),
    db.select().from(essays).where(isNull(essays.deletedAt)),
    db.select().from(timelineNodes),
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(5),
    db
      .select()
      .from(essays)
      .where(and(eq(essays.status, "draft"), isNull(essays.deletedAt))),
  ]);

  const incompleteAgents = allAgents
    .filter((a) => {
      if (!a.desc || a.desc.trim().length === 0) return true;
      if (a.status !== "coming" && !a.launchUrl) return true;
      return false;
    })
    .map((a) => ({
      id: a.id,
      sn: a.sn,
      name: a.name.replace(/<\/?em>/g, ""),
      issue: !a.desc?.trim() ? "缺少描述" : "缺少 launchUrl",
    }));

  return {
    kpi: {
      agents: allAgents.length,
      essays: allEssays.length,
      essaysDraft: allEssays.filter((e) => e.status === "draft").length,
      essaysPublished: allEssays.filter((e) => e.status === "published").length,
      agentsActive: allAgents.filter((a) => a.status === "active").length,
      agentsComing: allAgents.filter((a) => a.status === "coming").length,
      timelineNodes: allTimeline.length,
    },
    recentActivity: recentLogs.map((log) => ({
      id: log.id,
      action: log.action,
      targetType: log.targetType,
      summary: log.summary,
      createdAt: log.createdAt,
    })),
    todo: {
      draftEssays: drafts.map((e) => ({
        id: e.id,
        sn: e.sn,
        title: e.title.replace(/<\/?em>/g, ""),
        updatedAt: e.updatedAt,
      })),
      incompleteAgents,
    },
  };
}

export { count, isNull };

export async function listAuditLogsForAdmin(opts?: { action?: string; limit?: number }) {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const db = await getDb();
  const limit = opts?.limit ?? 50;
  const baseQuery =
    opts?.action != null
      ? db
          .select()
          .from(auditLogs)
          .where(eq(auditLogs.action, opts.action as never))
      : db.select().from(auditLogs);
  const rows = await baseQuery.orderBy(desc(auditLogs.createdAt)).limit(limit);
  return rows.map((log) => ({
    id: log.id,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    summary: log.summary,
    createdAt: log.createdAt,
  }));
}
