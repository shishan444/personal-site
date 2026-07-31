import { randomBytes } from "node:crypto";
import { and, eq, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { getPgliteDb } from "@/lib/db/pglite";
import { sessions, users } from "@/lib/db/schema";
import { COOKIE_NAME, SESSION_TTL_SECONDS } from "./constants";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "editor" | "author" | "viewer";
  mustChangePassword: boolean;
}

export interface SessionData {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  user: SessionUser;
}

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createSession(userId: string): Promise<SessionData> {
  const db = await getPgliteDb();
  const user = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!user) throw new Error("user not found");

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  const [session] = await db
    .insert(sessions)
    .values({
      userId,
      token,
      expiresAt,
    })
    .returning();

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));

  return {
    id: session.id,
    userId,
    token,
    expiresAt,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
  };
}

export async function getSession(tokenOverride?: string): Promise<SessionData | null> {
  let token: string | undefined;
  if (tokenOverride !== undefined) {
    token = tokenOverride || undefined;
    if (!token) return null;
  } else {
    const store = await cookies();
    token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;
  }

  const db = await getPgliteDb();
  const session = (await db.select().from(sessions).where(eq(sessions.token, token)).limit(1))[0];

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, session.id));
    return null;
  }

  const user = (await db.select().from(users).where(eq(users.id, session.userId)).limit(1))[0];
  if (!user) return null;

  return {
    id: session.id,
    userId: user.id,
    token: session.token,
    expiresAt: session.expiresAt,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
  };
}

export async function destroySession(tokenOverride?: string): Promise<void> {
  let token: string | undefined;
  if (tokenOverride !== undefined) {
    token = tokenOverride || undefined;
  } else {
    const store = await cookies();
    token = store.get(COOKIE_NAME)?.value;
  }
  if (token) {
    const db = await getPgliteDb();
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  if (tokenOverride === undefined) {
    const store = await cookies();
    store.delete(COOKIE_NAME);
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearExpiredSessions(): Promise<number> {
  const db = await getPgliteDb();
  const now = new Date();
  const before = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(lt(sessions.expiresAt, now));
  if (before.length === 0) return 0;
  await db.delete(sessions).where(lt(sessions.expiresAt, now));
  return before.length;
}

export async function authenticateByEmailPassword(
  email: string,
  password: string,
): Promise<SessionData> {
  const db = await getPgliteDb();
  const user = (
    await db
      .select()
      .from(users)
      .where(and(eq(users.email, email)))
      .limit(1)
  )[0];
  if (!user) throw new Error("INVALID_CREDENTIALS");
  if (!user.passwordHash) throw new Error("NO_PASSWORD_SET");

  const { verifyPassword } = await import("./password");
  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) throw new Error("INVALID_CREDENTIALS");

  return createSession(user.id);
}

export { COOKIE_NAME, SESSION_TTL_SECONDS };
