import { env } from "cloudflare:test";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Applies all SQL migrations from packages/database/migrations to the test D1
 * binding. Call once in `beforeAll` of every integration suite.
 */
export async function applyMigrations(): Promise<void> {
  const dir = resolve(__dirname, "../../../../packages/database/migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const sql = readFileSync(resolve(dir, file), "utf-8");
    const statements = sql
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      await env.DB.prepare(stmt).run();
    }
  }
}
