import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { setAsNow } from "@/lib/actions/timeline";
import type { HomeTimelineNode } from "@/lib/queries/site";
import { getHomeTimeline } from "@/lib/queries/site";

export default async function AdminTimelinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const nodes = await getHomeTimeline();

  const columns: DataTableColumn<HomeTimelineNode>[] = [
    {
      key: "version",
      header: t("admin.timeline_node.col.version"),
      width: "80px",
      cell: (n) => (
        <Link
          href={`/${locale}/admin/timeline/${n.id}`}
          className="hover:text-[var(--color-accent)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {n.version}
        </Link>
      ),
    },
    {
      key: "name",
      header: t("admin.timeline_node.col.name"),
      cell: (n) => <span dangerouslySetInnerHTML={{ __html: n.name }} />,
    },
    {
      key: "type",
      header: t("admin.timeline_node.col.type"),
      width: "100px",
      cell: (n) => (
        <StatusBadge
          variant={
            n.type === "now"
              ? "warn"
              : n.type === "first"
                ? "active"
                : n.type === "future"
                  ? "archived"
                  : "neutral"
          }
          dot
        >
          {t(`timeline.node_${n.type}`)}
        </StatusBadge>
      ),
    },
    {
      key: "date",
      header: t("admin.timeline_node.col.date"),
      width: "100px",
      cell: (n) => (
        <span
          style={{ fontFamily: "var(--font-mono)" }}
          className="text-[10px] text-[var(--color-ink-soft)]"
        >
          {n.date}
        </span>
      ),
    },
    {
      key: "now",
      header: t("admin.timeline_node.col.now"),
      width: "120px",
      cell: (n) =>
        n.isNow ? (
          <span
            className="text-[10px] uppercase tracking-widest text-[var(--color-accent)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {t("admin.timeline_node.now_badge")}
          </span>
        ) : (
          <form
            action={async () => {
              "use server";
              await setAsNow(n.id);
            }}
          >
            <button
              type="submit"
              className="text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)] hover:text-[var(--color-accent)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {t("admin.timeline_node.set_as_now")}
            </button>
          </form>
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
          {t("admin.sidebar_timeline")}
        </h1>
        <Button asChild>
          <Link href={`/${locale}/admin/timeline/new`}>{t("common.button.create")}</Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={nodes}
        rowKey={(n) => n.id}
        empty={t("common.label.empty")}
      />
    </div>
  );
}
