import { getDb } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "archive"
  | "login"
  | "logout"
  | "restore";

export interface AuditLogInput {
  userId?: string | null;
  action: AuditAction;
  targetType: string;
  targetId?: string | null;
  summary?: string;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(auditLogs).values({
      userId: input.userId ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      summary: input.summary ?? null,
      metadata: input.metadata ?? null,
    });
  } catch (err) {
    console.error("[audit] 写入失败", err);
  }
}
