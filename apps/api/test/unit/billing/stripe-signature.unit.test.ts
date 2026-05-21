import { verifyStripeSignature } from "@retardmaxxing/billing";
import { describe, expect, it } from "vitest";
import { signStripePayload } from "../../helpers/stripe-sig";

const SECRET = "whsec_test_secret";

describe("verifyStripeSignature", () => {
  it("accepts a fresh, correctly signed payload", async () => {
    const body = JSON.stringify({ id: "evt_1", type: "ping" });
    const { header } = await signStripePayload(body, SECRET);
    expect(await verifyStripeSignature(body, header, SECRET)).toBe(true);
  });

  it("rejects a payload signed with a different secret", async () => {
    const body = JSON.stringify({ id: "evt_1" });
    const { header } = await signStripePayload(body, "other_secret");
    expect(await verifyStripeSignature(body, header, SECRET)).toBe(false);
  });

  it("rejects stale payloads (> 5 min)", async () => {
    const body = JSON.stringify({ id: "evt_1" });
    const stale = Math.floor(Date.now() / 1000) - 600;
    const { header } = await signStripePayload(body, SECRET, stale);
    expect(await verifyStripeSignature(body, header, SECRET)).toBe(false);
  });

  it("rejects malformed signature headers", async () => {
    const body = "{}";
    expect(await verifyStripeSignature(body, "garbage", SECRET)).toBe(false);
    expect(await verifyStripeSignature(body, "t=1,v0=abc", SECRET)).toBe(false);
  });
});
