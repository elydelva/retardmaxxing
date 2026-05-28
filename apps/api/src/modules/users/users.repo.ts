import type { Database, NewUser, User } from "@retardmaxxing/database";
import { identities, sessions, users } from "@retardmaxxing/database";
import { eq } from "drizzle-orm";

export interface UsersRepo {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByProviderIdentity(
    provider: "google" | "apple",
    providerUserId: string
  ): Promise<User | null>;
  insertUser(values: NewUser): Promise<void>;
  insertIdentity(values: {
    id: string;
    userId: string;
    provider: "google" | "apple";
    providerUserId: string;
  }): Promise<void>;
  insertSession(values: { id: string; userId: string; expiresAt: Date }): Promise<void>;
  deleteSession(id: string): Promise<void>;
  setEmailVerified(userId: string, at: Date): Promise<void>;
  updatePhoneNumber(userId: string, phoneNumber: string | null): Promise<void>;
}

export function createUsersRepo({ db }: { db: Database }): UsersRepo {
  return {
    async findById(id) {
      return (await db.select().from(users).where(eq(users.id, id)).get()) ?? null;
    },
    async findByEmail(email) {
      return (await db.select().from(users).where(eq(users.email, email)).get()) ?? null;
    },
    async findByProviderIdentity(_provider, providerUserId) {
      const row = await db
        .select({ user: users })
        .from(identities)
        .innerJoin(users, eq(identities.userId, users.id))
        .where(eq(identities.providerUserId, providerUserId))
        .get();
      if (!row || row.user === undefined) return null;
      return row.user;
    },
    async insertUser(values) {
      await db.insert(users).values(values);
    },
    async insertIdentity(values) {
      await db.insert(identities).values({ ...values, createdAt: new Date() });
    },
    async insertSession(values) {
      await db.insert(sessions).values({ ...values, createdAt: new Date() });
    },
    async deleteSession(id) {
      await db.delete(sessions).where(eq(sessions.id, id));
    },
    async setEmailVerified(userId, at) {
      await db
        .update(users)
        .set({ emailVerifiedAt: at, updatedAt: new Date() })
        .where(eq(users.id, userId));
    },
    async updatePhoneNumber(userId, phoneNumber) {
      await db
        .update(users)
        .set({ phoneNumber, updatedAt: new Date() })
        .where(eq(users.id, userId));
    },
  };
}
