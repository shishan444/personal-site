import { AlertCircle, FileEdit, Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { KpiCard } from "@/components/shared";
import { getAdminDashboard } from "@/lib/queries/admin";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const data = await getAdminDashboard();

  return (
    <div className="space-y-10 max-w-6xl">
      <div className="flex items-baseline justify-between">
        <div>
          <div
            className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-accent)] mb-1"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {t("dashboard.last_sync")}
          </div>
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("dashboard.title")}{" "}
            <span
              className="text-[var(--color-accent)]"
              style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}
            >
              {t("dashboard.title_accent")}
            </span>
          </h1>
        </div>
      </div>

      <section>
        <div
          className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)] mb-3"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          KPI
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label={t("dashboard.kpi_agents")} value={data.kpi.agents} accent />
          <KpiCard label={t("dashboard.kpi_essays")} value={data.kpi.essays} />
          <KpiCard label={t("dashboard.kpi_drafts")} value={data.kpi.essaysDraft} />
          <KpiCard label="PUBLISHED" value={data.kpi.essaysPublished} />
          <KpiCard label="ACTIVE AGENTS" value={data.kpi.agentsActive} />
          <KpiCard label="COMING" value={data.kpi.agentsComing} />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {t("dashboard.quick_actions")}
            </h2>
          </div>
          <div className="space-y-2">
            <QuickAction
              href={`/${locale}/admin/writing/new`}
              icon={<Plus className="w-3 h-3" />}
              label={`${t("common.button.create")} · ${t("admin.sidebar_writing")}`}
            />
            <QuickAction
              href={`/${locale}/admin/agents/new`}
              icon={<Plus className="w-3 h-3" />}
              label={`${t("common.button.create")} · ${t("admin.sidebar_agents")}`}
            />
            <QuickAction
              href={`/${locale}/admin/timeline/new`}
              icon={<Plus className="w-3 h-3" />}
              label={`${t("common.button.create")} · ${t("admin.sidebar_timeline")}`}
            />
          </div>
        </section>

        <section>
          <h2
            className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)] mb-4"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {t("dashboard.todo")}
          </h2>
          {data.todo.draftEssays.length === 0 && data.todo.incompleteAgents.length === 0 ? (
            <div
              className="text-xs text-[var(--color-ink-soft)] border border-dashed border-[var(--color-line)] p-6 text-center"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              ✅ {t("common.label.empty")}
            </div>
          ) : (
            <ul className="space-y-2">
              {data.todo.draftEssays.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-2 border border-[var(--color-line)] p-2.5"
                >
                  <FileEdit className="w-3 h-3 text-[var(--color-accent)]" />
                  <span
                    className="text-xs text-[var(--color-ink-mute)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {e.sn}
                  </span>
                  <span
                    className="text-sm text-[var(--color-ink)] flex-1 truncate"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {e.title}
                  </span>
                </li>
              ))}
              {data.todo.incompleteAgents.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-2 border border-[var(--color-line)] p-2.5"
                >
                  <AlertCircle className="w-3 h-3 text-[var(--color-accent)]" />
                  <span
                    className="text-xs text-[var(--color-ink-mute)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {a.sn}
                  </span>
                  <span
                    className="text-sm text-[var(--color-ink)] flex-1 truncate"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {a.name}
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-widest text-[var(--color-accent)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {a.issue}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <h2
          className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)] mb-3"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {t("dashboard.recent_activity")}
        </h2>
        {data.recentActivity.length === 0 ? (
          <div
            className="text-xs text-[var(--color-ink-soft)] border border-dashed border-[var(--color-line)] p-6 text-center"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            — {t("common.label.empty")} —
          </div>
        ) : (
          <ul className="border border-[var(--color-line)] divide-y divide-[var(--color-line)]">
            {data.recentActivity.map((log) => (
              <li key={log.id} className="px-3 py-2 flex items-center gap-3 text-sm">
                <span
                  className="text-[10px] uppercase tracking-widest text-[var(--color-accent)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {log.action}
                </span>
                <span
                  className="text-xs text-[var(--color-ink-mute)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {log.targetType}
                </span>
                <span
                  className="flex-1 text-[var(--color-ink)] truncate"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {log.summary ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 border border-[var(--color-line)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] p-2.5 text-sm text-[var(--color-ink)]"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
