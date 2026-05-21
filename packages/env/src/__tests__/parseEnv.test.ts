import { describe, expect, it } from "vitest";
import { ENVS, isEnv, parseEnv } from "../index";

describe("parseEnv", () => {
  it("returns valid env as-is", () => {
    for (const e of ENVS) {
      expect(parseEnv(e)).toBe(e);
    }
  });

  it("falls back to local by default", () => {
    expect(parseEnv(undefined)).toBe("local");
    expect(parseEnv("nope")).toBe("local");
    expect(parseEnv(42)).toBe("local");
  });

  it("uses provided fallback", () => {
    expect(parseEnv(undefined, "production")).toBe("production");
    expect(parseEnv("???", "staging")).toBe("staging");
  });
});

describe("isEnv", () => {
  it("accepts only known envs", () => {
    expect(isEnv("local")).toBe(true);
    expect(isEnv("staging")).toBe(true);
    expect(isEnv("production")).toBe(true);
    expect(isEnv("dev")).toBe(false);
    expect(isEnv(null)).toBe(false);
  });
});
