import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";
import { unstable_splitSqlQuery } from "wrangler";

const migrationsPath = resolve(__dirname, "../../packages/database/migrations");
const migrations = readdirSync(migrationsPath, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((entry) => ({
    name: entry.name,
    queries: unstable_splitSqlQuery(
      readFileSync(resolve(migrationsPath, entry.name, "migration.sql"), "utf8")
    ),
  }));

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.toml" },
      miniflare: {
        compatibilityDate: "2025-10-01",
        compatibilityFlags: ["nodejs_compat"],
        d1Databases: ["DB"],
        r2Buckets: ["OBJECTS"],
        kvNamespaces: ["CACHE"],
        bindings: { TEST_MIGRATIONS: migrations },
      },
    }),
  ],
  test: {
    name: "integration",
    include: ["test/integration/**/*.int.test.ts"],
  },
});
