import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import type { AdminAgentRow } from "@/lib/queries/admin-list";
import { listAgentsForAdmin } from "@/lib/queries/admin-list";

export default async function AdminAgentsListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const agents = await listAgentsForAdmin();

  const columns: DataTableColumn<AdminAgentRow>[] = [
    {
      key: "order",
      header: "#",
      width: "40px",
      cell: (a) => (
        <span
          className="text-[10px] text-[var(--color-ink-soft)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {String(a.order).padStart(2, "0")}
        </span>
      ),
    },
    {
      key: "sn",
      header: "SN",
      width: "100px",
      cell: (a) => (
        <span
          className="text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {a.sn}
        </span>
      ),
    },
    {
      key: "name",
      header: "Name",
      cell: (a) => (
        <Link href={`/${locale}/admin/agents/${a.id}`} className="hover:text-[var(--color-accent)]">
          {a.name}
        </Link>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "120px",
      cell: (a) => (
        <StatusBadge
          variant={
            a.status === "active"
              ? "active"
              : a.status === "beta"
                ? "warn"
                : a.status === "coming"
                  ? "neutral"
                  : "archived"
          }
          dot
        >
          {t(`agent.status_${a.status}`)}
        </StatusBadge>
      ),
    },
    {
      key: "specs",
      header: "Specs",
      width: "60px",
      cell: (a) => (
        <span
          style={{ fontFamily: "var(--font-mono)" }}
          className="text-[10px] text-[var(--color-ink-mute)]"
        >
          {a.specsCount}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t("admin.sidebar_agents")}
        </h1>
        <Button asChild>
          <Link href={`/${locale}/admin/agents/new`}>{t("common.button.create")}</Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={agents}
        rowKey={(a) => a.id}
        empty={t("common.label.empty")}
      />
    </div>
  );
}
