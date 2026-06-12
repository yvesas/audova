import "server-only";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb, anonSessions } from "@audova/db";

const COOKIE = "aud_sid";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Anonymous-first: identify a visitor by a cookie token (the fingerprint) so quota can apply
 * without login. Creates the session row on first use. Must be called from an action/route
 * (it may set the cookie). See .claude/rules/security-and-privacy.md
 */
export async function getOrCreateAnonSession(): Promise<string> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value ?? crypto.randomUUID();
  const db = getDb();

  const [row] = await db
    .insert(anonSessions)
    .values({ fingerprint: token })
    .onConflictDoUpdate({
      target: anonSessions.fingerprint,
      set: { lastSeenAt: new Date() },
    })
    .returning({ id: anonSessions.id });

  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR,
    path: "/",
  });

  return row!.id;
}

/** Read-only lookup (no cookie mutation) — safe in Server Components for display. */
export async function getAnonSessionId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const db = getDb();
  const found = await db.query.anonSessions.findFirst({
    where: eq(anonSessions.fingerprint, token),
  });
  return found?.id ?? null;
}
