import { getTranslations } from "next-intl/server";
import { loginAction } from "@/lib/auth/actions";
import { LoginForm } from "./form";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: `${t("login_title")} · ATELIER` };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const [{ locale }, { from }] = await Promise.all([params, searchParams]);
  return <LoginForm action={loginAction} fromPath={from ?? `/${locale}/admin`} locale={locale} />;
}
