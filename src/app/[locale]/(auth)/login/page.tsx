import { loginAction } from "@/lib/auth/actions";
import { LoginForm } from "./form";

export const metadata = {
  title: "登录 · ATELIER",
};

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const [{ locale }, { from }] = await Promise.all([params, searchParams]);
  return <LoginForm action={loginAction} fromPath={from ?? "/admin"} locale={locale} />;
}
