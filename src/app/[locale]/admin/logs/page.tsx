import { getTranslations, setRequestLocale } from "next-intl/server";
import { StatusBadge } from "@/components/shared";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { makeAuditLabeler } from "@/lib/audit-labels";
import { listAuditLogsForAdmin } from "@/lib/queries/admin";

interface AuditLogRow {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  summary: string | null;
  createdAt: Date;
}

export default async function AdminLogsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const logs = await listAuditLogsForAdmin({ limit: 100 });
  const auditLabel = makeAuditLabeler(t);

  const columns: DataTableColumn<AuditLogRow>[] = [
    {
      key: "createdAt",
      header: t("admin.logs_col_time"),
      width: "160px",
      cell: (l) => (
        <span
          className="text-[10px] text-[var(--color-ink-soft)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {l.createdAt.toISOString().replace("T", " ").slice(0, 19)}
        </span>
      ),
    },
    {
      key: "action",
      header: t("admin.logs_col_action"),
      width: "100px",
      cell: (l) => (
        <StatusBadge
          variant={
            l.action === "create" || l.action === "publish"
              ? "active"
              : l.action === "delete" || l.action === "archive"
                ? "danger"
                : "warn"
          }
        >
          {auditLabel.action(l.action)}
        </StatusBadge>
      ),
    },
    {
      key: "targetType",
      header: t("admin.logs_col_target"),
      width: "120px",
      cell: (l) => (
        <span
          className="text-[10px] tracking-widest text-[var(--color-ink-mute)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {auditLabel.target(l.targetType)}
        </span>
      ),
    },
    {
      key: "summary",
      header: t("admin.logs_col_summary"),
      cell: (l) => (
        <span
          className="text-sm text-[var(--color-ink)] truncate"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {l.summary ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <h1
        className="text-3xl font-bold tracking-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {t("admin.logs_title")}
      </h1>
      <DataTable
        columns={columns}
        data={logs}
        rowKey={(l) => l.id}
        empty={t("common.label.empty")}
      />
    </div>
  );
}
