import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";
import { getSession } from "@/lib/auth";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/login?from=/${locale}/admin`);
  }
  if (session.user.mustChangePassword) {
    redirect(`/${locale}/change-password`);
  }

  const _t = await getTranslations({ locale });

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar userEmail={session.user.email} />
      <div className="flex-1 flex">
        <Sidebar locale={locale} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
