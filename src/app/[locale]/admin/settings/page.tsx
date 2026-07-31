import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSiteConfigForAdmin, updateSiteConfig } from "@/lib/actions/site-config";
import { SiteConfigForm } from "./form";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const config = await getSiteConfigForAdmin();
  if (!config) redirect(`/${locale}/admin`);

  async function save(formData: FormData) {
    "use server";
    await updateSiteConfig({
      siteName: String(formData.get("siteName") ?? ""),
      subtitle: String(formData.get("subtitle") ?? ""),
      currentVersion: String(formData.get("currentVersion") ?? ""),
      currentCalibre: String(formData.get("currentCalibre") ?? ""),
      heroSub: String(formData.get("heroSub") ?? ""),
      rdMeta1: String(formData.get("rdMeta1") ?? ""),
      rdMeta2: String(formData.get("rdMeta2") ?? ""),
      theme: String(formData.get("theme") ?? "warm-amber"),
    });
    redirect(`/${locale}/admin/settings`);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1
        className="text-3xl font-bold tracking-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {t("admin.sidebar_settings")}
      </h1>
      <SiteConfigForm action={save} initial={config} />
    </div>
  );
}
