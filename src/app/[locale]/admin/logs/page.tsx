import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function AdminLogsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const labelMap: Record<string, string> = {
    writing: t("admin.sidebar_writing"),
    agents: t("admin.sidebar_agents"),
    timeline: t("admin.sidebar_timeline"),
    assets: t("admin.sidebar_assets"),
    tags: "Tags",
    settings: t("admin.sidebar_settings"),
    logs: "Logs",
  };
  return (
    <div className="max-w-4xl">
      <h1
        className="text-3xl font-bold tracking-tight mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {labelMap.logs}
      </h1>
      <p
        className="text-xs text-[var(--color-ink-soft)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        ⏳ 将在后续子任务实现（2.10 / 2.11）
      </p>
    </div>
  );
}
