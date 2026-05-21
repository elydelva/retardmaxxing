import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { eq } from "drizzle-orm";
import { sessions, users, type Database, type Session, type User } from "@retardmaxxing/database";

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export function hashToken(token: string): string {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export async function createSession(
  db: Database,
  userId: string,
  token: string
): Promise<Session> {
  const id = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const session: Session = {
    id,
    userId,
    expiresAt,
    createdAt: new Date(),
  };
  await db.insert(sessions).values(session);
  return session;
}

export async function validateSession(
  db: Database,
  token: string
): Promise<{ session: Session; user: User } | null> {
  const id = hashToken(token);
  const row = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, id))
    .get();
  if (!row) return null;
  if (row.session.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }
  return row;
}

export async function invalidateSession(db: Database, token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
}
