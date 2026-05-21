import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { createAuthService, type AuthServiceDeps } from "../../../src/modules/auth/auth.service";
import { createFakeUsersRepo, makeUser, silentLogger } from "../../helpers/fakes";
import type { AppBindings } from "../../../src/lib/bindings";

const stubEnv = {} as AppBindings;
const stubDb = {
  insert: () => ({ values: async () => undefined }),
} as unknown as AuthServiceDeps["db"];

const validInput = {
  email: "ada@test.dev",
  password: "hunter2hunter",
  name: "Ada",
};

describe("authService.signUp", () => {
  it("creates a new user and returns a session", async () => {
    const usersRepo = createFakeUsersRepo();
    const insertSpy = vi.spyOn(usersRepo, "insertUser");
    const service = createAuthService({
      db: stubDb,
      env: stubEnv,
      usersRepo,
      logger: silentLogger,
    });

    const result = await service.signUp(validInput);

    expect(insertSpy).toHaveBeenCalledOnce();
    expect(result.email).toBe(validInput.email);
    expect(result.userId).toMatch(/^u_/);
    expect(result.signingKey.length).toBeGreaterThan(10);
    expect(result.expiresAt).toBeGreaterThan(Date.now());
  });

  it("throws CONFLICT when email already exists (pre-check)", async () => {
    const usersRepo = createFakeUsersRepo({
      findByEmail: async () => makeUser({ email: validInput.email }),
    });
    const service = createAuthService({
      db: stubDb,
      env: stubEnv,
      usersRepo,
      logger: silentLogger,
    });

    await expect(service.signUp(validInput)).rejects.toMatchObject({
      code: "CONFLICT",
    } satisfies Partial<TRPCError>);
  });

  it("translates UNIQUE constraint race into CONFLICT", async () => {
    const usersRepo = createFakeUsersRepo({
      insertUser: async () => {
        throw new Error("UNIQUE constraint failed: users.email");
      },
    });
    const service = createAuthService({
      db: stubDb,
      env: stubEnv,
      usersRepo,
      logger: silentLogger,
    });

    await expect(service.signUp(validInput)).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("authService.signIn", () => {
  it("rejects when no user", async () => {
    const usersRepo = createFakeUsersRepo();
    const service = createAuthService({
      db: stubDb,
      env: stubEnv,
      usersRepo,
      logger: silentLogger,
    });
    await expect(
      service.signIn({ email: "ghost@test.dev", password: "x" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects when password missing", async () => {
    const usersRepo = createFakeUsersRepo({
      findByEmail: async () => makeUser({ passwordHash: null }),
    });
    const service = createAuthService({
      db: stubDb,
      env: stubEnv,
      usersRepo,
      logger: silentLogger,
    });
    await expect(
      service.signIn({ email: "ada@test.dev", password: "x" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
