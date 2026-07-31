"use server";

import { eq } from "drizzle-orm";
import {
  authenticateByEmailPassword,
  destroySession,
  getSession,
  hashPassword,
  setSessionCookie,
  validatePasswordInput,
} from "@/lib/auth";
import { getPgliteDb } from "@/lib/db/pglite";
import { users } from "@/lib/db/schema";

export type LoginState = {
  error?: string;
  redirect?: string;
};

export async function loginAction(
  _prev: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/admin");
  const locale = String(formData.get("locale") ?? "zh");

  if (!email || !password) {
    return { error: "请输入邮箱和密码" };
  }

  try {
    const session = await authenticateByEmailPassword(email, password);
    await setSessionCookie(session.token);
    if (session.user.mustChangePassword) {
      return { redirect: `/${locale}/change-password` };
    }
    return { redirect: from };
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_CREDENTIALS") {
      return { error: "邮箱或密码错误" };
    }
    throw err;
  }
}

export type ChangePasswordState = { error?: string; ok?: boolean } | undefined;

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await getSession();
  if (!session) return { error: "请先登录" };

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("new") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (next !== confirm) return { error: "两次输入的新密码不一致" };

  const validationError = validatePasswordInput(next);
  if (validationError) return { error: validationError };

  const db = await getPgliteDb();
  const user = (await db.select().from(users).where(eq(users.id, session.userId)).limit(1))[0];
  if (!user?.passwordHash) return { error: "用户无密码，请联系管理员" };

  const { verifyPassword } = await import("./password");
  if (!(await verifyPassword(user.passwordHash, current))) {
    return { error: "当前密码错误" };
  }

  const newHash = await hashPassword(next);
  await db
    .update(users)
    .set({ passwordHash: newHash, mustChangePassword: false, updatedAt: new Date() })
    .where(eq(users.id, session.userId));

  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
}
