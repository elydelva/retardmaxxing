import { defineConfig } from "vitest/config";

/**
 * Root vitest config — orchestrates two projects:
 *   - unit (Node env, mocked deps)
 *   - integration (Cloudflare Workers pool, real D1)
 *
 * Run: `bun run test`              all
 *      `bunx vitest --project unit`
 *      `bunx vitest --project integration`
 */
export default defineConfig({
  test: {
    projects: ["./vitest.unit.config.ts", "./vitest.integration.config.ts"],
  },
});
