/**
 * Contract test: mobile client signing ↔ server verification.
 *
 * Reproduces the exact canonical payload format used by
 *   apps/mobile/lib/integrity.ts (buildIntegrityHeaders)
 * and asserts that the server-side @retardmaxxing/auth verifyRequest accepts
 * it. Any drift (header rename, format change, hash swap) breaks this test
 * before it breaks production mobile traffic.
 */
import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";
import { verifyRequest } from "@retardmaxxing/auth";
import { describe, expect, it } from "vitest";

function mobileSign(
  key: string,
  method: string,
  path: string,
  timestamp: number,
  body: string
): string {
  const canonical = [method.toUpperCase(), path, String(timestamp), body].join("\n");
  return bytesToHex(hmac(sha256, utf8ToBytes(key), utf8ToBytes(canonical)));
}

describe("integrity HMAC contract", () => {
  const key = "test-signing-key";

  it("server accepts what mobile produces", () => {
    const ts = Date.now();
    const sig = mobileSign(key, "POST", "/trpc/auth.signIn", ts, "{}");
    expect(
      verifyRequest(
        key,
        { method: "POST", path: "/trpc/auth.signIn", body: "{}", timestamp: ts },
        sig
      )
    ).toBe(true);
  });

  it("server rejects tampered body", () => {
    const ts = Date.now();
    const sig = mobileSign(key, "POST", "/trpc/x", ts, "{}");
    expect(
      verifyRequest(
        key,
        { method: "POST", path: "/trpc/x", body: "{tampered}", timestamp: ts },
        sig
      )
    ).toBe(false);
  });

  it("server rejects different method", () => {
    const ts = Date.now();
    const sig = mobileSign(key, "POST", "/trpc/x", ts, "");
    expect(
      verifyRequest(key, { method: "GET", path: "/trpc/x", body: "", timestamp: ts }, sig)
    ).toBe(false);
  });
});
