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

const LOGIN_MAX_FAILURES = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

const loginFailures = new Map<string, { count: number; lockedUntil: number }>();

function isLoginRateLimited(email: string): boolean {
  const rec = loginFailures.get(email);
  if (!rec) return false;
  if (rec.lockedUntil > Date.now()) return true;
  loginFailures.delete(email);
  return false;
}

function recordLoginFailure(email: string): void {
  const rec = loginFailures.get(email) ?? { count: 0, lockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= LOGIN_MAX_FAILURES) {
    rec.count = 0;
    rec.lockedUntil = Date.now() + LOGIN_LOCK_MS;
  }
  loginFailures.set(email, rec);
}

function clearLoginFailures(email: string): void {
  loginFailures.delete(email);
}

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
  const locale = String(formData.get("locale") ?? "zh");
  const rawFrom = String(formData.get("from") ?? "");
  const from = rawFrom.startsWith("/") && !rawFrom.startsWith("//") ? rawFrom : `/${locale}/admin`;

  if (!email || !password) {
    return { error: "INVALID_CREDENTIALS" };
  }
  if (isLoginRateLimited(email)) {
    return { error: "RATE_LIMITED" };
  }

  try {
    const session = await authenticateByEmailPassword(email, password);
    clearLoginFailures(email);
    await setSessionCookie(session.token);
    if (session.user.mustChangePassword) {
      return { redirect: `/${locale}/change-password` };
    }
    return { redirect: from };
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_CREDENTIALS") {
      recordLoginFailure(email);
      return { error: "INVALID_CREDENTIALS" };
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
  if (!session) return { error: "UNAUTHORIZED" };

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("new") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (next !== confirm) return { error: "MISMATCH" };

  const validationError = validatePasswordInput(next);
  if (validationError) return { error: validationError };

  const db = await getPgliteDb();
  const user = (await db.select().from(users).where(eq(users.id, session.userId)).limit(1))[0];
  if (!user?.passwordHash) return { error: "NO_PASSWORD" };

  const { verifyPassword } = await import("./password");
  if (!(await verifyPassword(user.passwordHash, current))) {
    return { error: "CURRENT_WRONG" };
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
