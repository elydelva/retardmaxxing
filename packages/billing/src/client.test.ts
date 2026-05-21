import { describe, expect, it } from "vitest";
import { verifyStripeSignature } from "./client";

async function sign(body: string, secret: string, ts: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${ts}.${body}`));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `t=${ts},v1=${hex}`;
}

describe("verifyStripeSignature", () => {
  it("accepts a fresh signature", async () => {
    const body = "{}";
    const secret = "whsec_x";
    const ts = Math.floor(Date.now() / 1000);
    const header = await sign(body, secret, ts);
    expect(await verifyStripeSignature(body, header, secret)).toBe(true);
  });

  it("rejects stale signatures", async () => {
    const body = "{}";
    const secret = "whsec_x";
    const ts = Math.floor(Date.now() / 1000) - 3600;
    const header = await sign(body, secret, ts);
    expect(await verifyStripeSignature(body, header, secret)).toBe(false);
  });
});
