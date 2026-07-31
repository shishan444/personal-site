import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { changePasswordAction } from "@/lib/auth/actions";
import { ChangePasswordForm } from "./form";

export const metadata = {
  title: "修改密码 · ATELIER",
};

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            设置新密码
          </h1>
          <p
            className="text-xs uppercase tracking-[0.3em] text-[var(--color-ink-mute)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            首次登录必须改密
          </p>
        </div>
        <ChangePasswordForm action={changePasswordAction} />
      </div>
    </main>
  );
}
