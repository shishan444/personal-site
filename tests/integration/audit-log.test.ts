import { describe, expect, it } from "vitest";
import { writeAuditLog } from "@/lib/audit";
import { getPgliteDb } from "@/lib/db/pglite";
import { auditLogs } from "@/lib/db/schema";

describe("L2 · audit_logs 写入（ROADMAP 2.9/2.11）", () => {
  it("F1 · writeAuditLog 应落库且字段完整", async () => {
    await writeAuditLog({
      action: "create",
      targetType: "essay",
      summary: "测试创建",
      metadata: { source: "l2-test" },
    });

    const db = await getPgliteDb();
    const rows = await db.select().from(auditLogs);
    const hit = rows.find((r) => r.summary === "测试创建");
    expect(hit).toBeDefined();
    expect(hit?.action).toBe("create");
    expect(hit?.targetType).toBe("essay");
    expect((hit?.metadata as { source?: string } | null)?.source).toBe("l2-test");
  });

  it("F2 · 仪表盘活动流查询应能读到审计记录", async () => {
    const { getAdminDashboard } = await import("@/lib/queries/admin");
    const dash = await getAdminDashboard();
    expect(dash.recentActivity.length).toBeGreaterThan(0);
  });
});
