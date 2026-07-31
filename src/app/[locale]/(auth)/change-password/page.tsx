import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { changePasswordAction } from "@/lib/auth/actions";
import { ChangePasswordForm } from "./form";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: `${t("change_password_title")} · ATELIER` };
}

export default async function ChangePasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("change_password_title")}
          </h1>
          <p
            className="text-xs uppercase tracking-[0.3em] text-[var(--color-ink-mute)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {t("change_password_required_hint")}
          </p>
        </div>
        <ChangePasswordForm action={changePasswordAction} locale={locale} />
      </div>
    </main>
  );
}
