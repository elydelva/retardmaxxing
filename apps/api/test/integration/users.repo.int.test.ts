import { env } from "cloudflare:test";
import { createDb } from "@retardmaxxing/database";
import { beforeAll, describe, expect, it } from "vitest";
import { createUsersRepo } from "../../src/modules/users/users.repo";
import { applyMigrations } from "../helpers/apply-migrations";

beforeAll(async () => {
  await applyMigrations();
});

describe("usersRepo (integration, real D1)", () => {
  const repo = createUsersRepo({ db: createDb(env.DB) });

  it("findByEmail returns null for unknown email", async () => {
    expect(await repo.findByEmail("nobody@test.dev")).toBeNull();
  });

  it("inserts and finds a user round-trip", async () => {
    await repo.insertUser({
      id: "u_int_1",
      email: "int1@test.dev",
      emailVerifiedAt: null,
      name: "Int One",
      avatarUrl: null,
      passwordHash: null,
      signingKey: "k1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const found = await repo.findByEmail("int1@test.dev");
    expect(found?.id).toBe("u_int_1");
    expect(found?.name).toBe("Int One");
  });

  it("setEmailVerified flips the timestamp", async () => {
    const at = new Date();
    await repo.setEmailVerified("u_int_1", at);
    const found = await repo.findById("u_int_1");
    expect(found?.emailVerifiedAt?.getTime()).toBe(at.getTime());
  });
});
