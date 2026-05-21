import type { User } from "@retardmaxxing/database";
import type { UsersRepo } from "../../src/modules/users/users.repo";
import type { Logger } from "../../src/lib/logger";

/**
 * In-memory `UsersRepo` for unit tests. Pass overrides to simulate scenarios:
 *
 *   const repo = createFakeUsersRepo({ findByEmail: async () => existingUser });
 */
export function createFakeUsersRepo(overrides: Partial<UsersRepo> = {}): UsersRepo {
  const usersById = new Map<string, User>();
  const usersByEmail = new Map<string, User>();
  return {
    async findById(id) {
      return usersById.get(id) ?? null;
    },
    async findByEmail(email) {
      return usersByEmail.get(email) ?? null;
    },
    async findByProviderIdentity() {
      return null;
    },
    async insertUser(values) {
      const u = values as User;
      usersById.set(u.id, u);
      usersByEmail.set(u.email, u);
    },
    async insertIdentity() {},
    async insertSession() {},
    async deleteSession() {},
    async setEmailVerified() {},
    ...overrides,
  };
}

export const silentLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
};

export function makeUser(over: Partial<User> = {}): User {
  return {
    id: "u_test",
    email: "ada@test.dev",
    emailVerifiedAt: null,
    name: "Ada",
    avatarUrl: null,
    passwordHash: null,
    signingKey: "key",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  };
}
