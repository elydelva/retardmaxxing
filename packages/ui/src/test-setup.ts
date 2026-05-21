import { afterEach, expect } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";

// Register happy-dom globally
GlobalRegistrator.register();
console.log("✓ Happy DOM registered, document available:", typeof document !== "undefined");

expect.extend(matchers);
afterEach(() => {
  cleanup();
});
