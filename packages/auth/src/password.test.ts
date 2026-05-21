import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("verifies a correct password", async () => {
    const hash = await hashPassword("hunter2hunter");
    expect(await verifyPassword(hash, "hunter2hunter")).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("hunter2hunter");
    expect(await verifyPassword(hash, "wrong")).toBe(false);
  });

  it("produces different hashes for the same password (random salt)", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toBe(b);
    expect(await verifyPassword(a, "same")).toBe(true);
    expect(await verifyPassword(b, "same")).toBe(true);
  });

  it("rejects malformed stored hashes", async () => {
    expect(await verifyPassword("not-a-hash", "x")).toBe(false);
    expect(await verifyPassword("pbkdf2$abc$xx$yy", "x")).toBe(false);
  });
});
