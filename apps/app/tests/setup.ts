import { Headers, Request, Response, fetch as undiciFetch } from "undici";

Object.assign(globalThis, {
  fetch: undiciFetch,
  Response,
  Request,
  Headers,
});

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./msw/server";

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
