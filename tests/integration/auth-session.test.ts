import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { hashPassword } from "@/lib/auth/password";
import {
  authenticateByEmailPassword,
  COOKIE_NAME,
  clearExpiredSessions,
  createSession,
  destroySession,
  getSession,
  SESSION_TTL_SECONDS,
} from "@/lib/auth/session";
import { getPgliteDb } from "@/lib/db/pglite";
import { sessions, users } from "@/lib/db/schema";

const OWNER_ID = "00000000-0000-0000-0000-000000000001";
const TEST_EMAIL = "owner@atelier.com";
const TEST_PASSWORD = "ChangeMe-On-First-Login";

async function ensureOwner() {
  const db = await getPgliteDb();
  const exists = (await db.select().from(users).where(eq(users.id, OWNER_ID)).limit(1))[0];
  if (!exists) {
    const hash = await hashPassword(TEST_PASSWORD);
    await db.insert(users).values({
      id: OWNER_ID,
      email: TEST_EMAIL,
      name: "GLM",
      role: "owner",
      passwordHash: hash,
      mustChangePassword: true,
      emailVerified: true,
    });
  }
}

describe("L2 · 认证 + 会话（session.ts）", () => {
  it("F1 · createSession 应创建一条 sessions 记录", async () => {
    await ensureOwner();
    const db = await getPgliteDb();
    const before = await db.select().from(sessions);
    const session = await createSession(OWNER_ID);
    expect(session.token).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(session.userId).toBe(OWNER_ID);
    expect(session.user.email).toBe(TEST_EMAIL);

    const after = await db.select().from(sessions);
    expect(after.length).toBe(before.length + 1);
  });

  it("F2 · getSession 正向（未过期 token）", async () => {
    await ensureOwner();
    const created = await createSession(OWNER_ID);
    const fetched = await getSession(created.token);
    expect(fetched?.userId).toBe(OWNER_ID);
    expect(fetched?.user.email).toBe(TEST_EMAIL);
  });

  it("F3 · getSession 反向（伪造 token）", async () => {
    const fetched = await getSession("fake-token");
    expect(fetched).toBeNull();
  });

  it("F3.2 · getSession 反向（空 token）", async () => {
    const fetched = await getSession("");
    expect(fetched).toBeNull();
  });

  it("F4 · authenticateByEmailPassword 正向", async () => {
    await ensureOwner();
    const session = await authenticateByEmailPassword(TEST_EMAIL, TEST_PASSWORD);
    expect(session.user.email).toBe(TEST_EMAIL);
  });

  it("F5 · authenticateByEmailPassword 反向（错误密码）", async () => {
    await ensureOwner();
    await expect(authenticateByEmailPassword(TEST_EMAIL, "wrong-pwd")).rejects.toThrow(
      /INVALID_CREDENTIALS/,
    );
  });

  it("F5.2 · authenticateByEmailPassword 反向（不存在的邮箱）", async () => {
    await expect(authenticateByEmailPassword("nobody@nowhere.dev", "anything")).rejects.toThrow(
      /INVALID_CREDENTIALS/,
    );
  });

  it("F6 · destroySession 应清理记录", async () => {
    await ensureOwner();
    const db = await getPgliteDb();
    const session = await createSession(OWNER_ID);
    const before = await db.select().from(sessions).where(eq(sessions.token, session.token));
    expect(before.length).toBe(1);

    await destroySession(session.token);

    const after = await db.select().from(sessions).where(eq(sessions.token, session.token));
    expect(after.length).toBe(0);
  });

  it("F7 · 过期 session 应被 getSession 拒绝", async () => {
    await ensureOwner();
    const db = await getPgliteDb();
    const session = await createSession(OWNER_ID);

    const pastDate = new Date(Date.now() - 1000);
    await db.update(sessions).set({ expiresAt: pastDate }).where(eq(sessions.id, session.id));

    const fetched = await getSession(session.token);
    expect(fetched).toBeNull();
  });

  it("F8 · clearExpiredSessions 应清掉过期记录", async () => {
    await ensureOwner();
    const db = await getPgliteDb();
    const session = await createSession(OWNER_ID);
    await db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(eq(sessions.id, session.id));

    const removed = await clearExpiredSessions();
    expect(removed).toBeGreaterThan(0);

    const remaining = await db.select().from(sessions).where(eq(sessions.id, session.id));
    expect(remaining.length).toBe(0);
  });

  it("F9 · 常量正确性（cookie 名 + TTL）", () => {
    expect(COOKIE_NAME).toBe("atelier_session");
    expect(SESSION_TTL_SECONDS).toBe(60 * 60 * 24 * 14);
  });

  it("F10 · createSession 同时更新 users.lastLoginAt", async () => {
    await ensureOwner();
    const db = await getPgliteDb();
    await db.update(users).set({ lastLoginAt: null }).where(eq(users.id, OWNER_ID));
    const before = (await db.select().from(users).where(eq(users.id, OWNER_ID)))[0];
    expect(before.lastLoginAt).toBeNull();

    await createSession(OWNER_ID);
    const after = (await db.select().from(users).where(eq(users.id, OWNER_ID)))[0];
    expect(after.lastLoginAt).toBeTruthy();
  });
});
