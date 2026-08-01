import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SortableAgentsList } from "@/components/admin/agents-sortable-list";
import { Button } from "@/components/ui/button";
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

  const statusLabels: Record<string, string> = {
    active: t("agent.status_active"),
    beta: t("agent.status_beta"),
    coming: t("agent.status_coming"),
    archived: t("agent.status_archived"),
  };

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

      <SortableAgentsList
        agents={agents}
        emptyText={t("common.label.empty")}
        locale={locale}
        statusLabels={statusLabels}
      />
    </div>
  );
}
