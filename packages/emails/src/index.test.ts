import { expect, it } from "vitest";
import { renderEmailVerification, renderWelcome } from "./index";

it("renderWelcome returns subject + html + text", async () => {
  const out = await renderWelcome({ name: "Ada", appUrl: "https://app.retardmaxxing.com" });
  expect(out.subject).toContain("Ada");
  expect(out.html).toContain("Ada");
  expect(out.text).toContain("Ada");
  expect(out.html.length).toBeGreaterThan(out.text.length);
});

it("renderEmailVerification puts verifyUrl in body", async () => {
  const url = "https://app.retardmaxxing.com/verify?t=abc";
  const out = await renderEmailVerification({ name: "Ada", verifyUrl: url, expiresInHours: 24 });
  expect(out.html).toContain(url);
  expect(out.text).toContain("24");
});
