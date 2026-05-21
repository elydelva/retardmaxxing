# Seeders

`packages/seed` is the per-environment fixture loader. It's **not** a content generator — no LLM, no audio, no images. It exists to plant structural rows: subscription plans, demo users, lookup tables, anything that should be the same across every fresh database.

## Run

```bash
bun seed list                                 # list registered seeders
bun seed run --env=local                      # run all (idempotent — hash-cached)
bun seed run --env=local --force              # ignore cache
bun seed run --env=local --dry-run            # plan only
bun seed run --only plans demo-users          # subset
bun seed run --tag subscription               # by tag
bun seed status --env=local                   # last-run timestamps per seeder
bun seed reset --env=local [--only plans]    # clear cache → re-run next time

# remote (staging)
bun seed run --env=staging --remote --yes

# production
SEED_ALLOW_REMOTE=1 bun seed run --env=production --remote --yes
```

## Adding a seeder

1. **Create** `packages/seed/src/seeders/<name>.ts`:

```ts
import { plans } from "@retardmaxxing/database";
import { eq } from "drizzle-orm";
import type { Seeder } from "../core/types";

interface Fixture { id: string; name: string; }

const FIXTURES: Record<"local" | "staging" | "production", Fixture[]> = {
  local: [{ id: "x_dev", name: "Dev" }],
  staging: [{ id: "x_stg", name: "Staging" }],
  production: [{ id: "x_prod", name: "Production" }],
};

export const xSeeder: Seeder = {
  name: "x",                            // unique
  description: "...",
  tags: ["fixtures"],                   // optional, for `--tag`
  envs: ["local", "staging"],           // optional, defaults to all
  dependsOn: ["plans"],                 // optional, topological order
  async hash(ctx) {                     // bump when the fixture data changes
    return JSON.stringify(FIXTURES[ctx.env]);
  },
  async run(ctx) {
    for (const f of FIXTURES[ctx.env]) {
      const existing = await ctx.db.select().from(plans).where(eq(plans.id, f.id)).get();
      if (existing) continue;
      await ctx.db.insert(plans).values({ /* ... */ });
    }
  },
};
```

2. **Register** in `packages/seed/src/seeders/_index.ts`:

```ts
export const ALL_SEEDERS: Seeder[] = [..., xSeeder];
```

3. **Verify**: `bun seed list` shows it. `bun seed run --env=local --only x`.

## Seeder rules

- **Idempotent**. Re-running must be a no-op when nothing changed. Detect existing rows (`select` first) and skip or `update`.
- **Hash bump on data change**. The CLI caches the hash per env in `.moon/cache/seed/<env>.json`; if `hash()` returns the same value, the seeder is skipped.
- **Use `ctx.dryRun`** to short-circuit writes early.
- **Don't reach across env**: the same seeder name can have different fixtures per `ctx.env`, but it should not assume external state.
- **Side effects via DI**: Stripe / R2 / KV / Queues are on `ctx`. Use them via `ctx.r2.put(...)`, etc. They're typed nullable; check before use.

## Production safety

`--env=production --remote` requires:

- `SEED_ALLOW_REMOTE=1` in env
- `--yes` flag

Without both, the CLI exits non-zero. This is enforced in `packages/seed/src/core/env.ts` (`isProductionWriteAllowed`).

## How the proxy works

`packages/seed/src/core/platform-proxy.ts` calls `getPlatformProxy()` from `wrangler`. This gives the CLI a real handle to D1/R2/KV/Queues without booting a Worker:

- `--env=local` → miniflare-backed bindings (writes to `.wrangler/state/`).
- `--env=staging|production` (with `--remote`) → real Cloudflare bindings via `wrangler` auth.

Drizzle wraps the D1 binding via `createDb(env.DB)`, identical to what the API does.
