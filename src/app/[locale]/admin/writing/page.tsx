import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import type { AdminEssayRow } from "@/lib/queries/admin-list";
import { listEssaysForAdmin } from "@/lib/queries/admin-list";

export default async function AdminWritingListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const { locale } = await params;
  const { status, type } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();
  const essays = await listEssaysForAdmin({
    status: status as "draft" | "published" | "archived" | undefined,
    typeTag: type as "essay" | "note" | "tutorial" | undefined,
  });

  const columns: DataTableColumn<AdminEssayRow>[] = [
    {
      key: "sn",
      header: t("admin.essay.col.sn"),
      width: "80px",
      cell: (e) => (
        <span
          className="text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {e.sn}
        </span>
      ),
    },
    {
      key: "title",
      header: t("admin.essay.col.title"),
      cell: (e) => (
        <Link
          href={`/${locale}/admin/writing/${e.id}`}
          className="hover:text-[var(--color-accent)]"
        >
          {e.title}
        </Link>
      ),
    },
    {
      key: "type",
      header: t("admin.essay.col.type"),
      width: "100px",
      cell: (e) => (
        <StatusBadge variant="neutral">{t(`admin.enum.essay_type.${e.typeTag}`)}</StatusBadge>
      ),
    },
    {
      key: "status",
      header: t("admin.essay.col.status"),
      width: "120px",
      cell: (e) => (
        <StatusBadge
          variant={e.status === "published" ? "active" : e.status === "draft" ? "warn" : "archived"}
          dot
        >
          {t(`admin.enum.essay_status.${e.status}`)}
        </StatusBadge>
      ),
    },
    {
      key: "lang",
      header: t("admin.essay.col.lang"),
      width: "60px",
      cell: (e) => (
        <span className="text-[10px] uppercase" style={{ fontFamily: "var(--font-mono)" }}>
          {e.lang}
        </span>
      ),
    },
    {
      key: "words",
      header: t("admin.essay.col.words"),
      width: "80px",
      cell: (e) => (
        <span className="text-[10px]" style={{ fontFamily: "var(--font-mono)" }}>
          {e.words}
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
          {t("admin.sidebar_writing")}
        </h1>
        <Button asChild>
          <Link href={`/${locale}/admin/writing/new`}>{t("common.button.create")}</Link>
        </Button>
      </div>

      <div
        className="flex items-center gap-3 text-[10px] uppercase tracking-widest"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <Link
          href={`/${locale}/admin/writing`}
          className={`px-2 py-1 ${
            !status
              ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]"
              : "text-[var(--color-ink-soft)]"
          }`}
        >
          {t("admin.essay.filter.all", { count: essays.length })}
        </Link>
        {(["draft", "published", "archived"] as const).map((s) => (
          <Link
            key={s}
            href={`/${locale}/admin/writing?status=${s}`}
            className={`px-2 py-1 ${
              status === s
                ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]"
                : "text-[var(--color-ink-soft)]"
            }`}
          >
            {t(`admin.enum.essay_status.${s}`)}
          </Link>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={essays}
        rowKey={(e) => e.id}
        empty={t("common.label.empty")}
      />
    </div>
  );
}
