# @retardmaxxing/seed

Per-environment seed CLI. Extensible by dropping new files in `src/seeders/`.

## Commands

```bash
seed list                                   # list registered seeders
seed run --env=local                        # run all (skips cached)
seed run --env=staging --remote --yes       # remote bindings
seed run --env=production --remote --yes    # requires SEED_ALLOW_REMOTE=1
seed run --only plans demo-users            # subset
seed run --tag subscription                 # by tag
seed run --dry-run                          # plan, no writes
seed run --force                            # ignore cache
seed status --env=local                     # last-run timestamps
seed reset --env=local [--only plans]       # clear cache
```

## Adding a seeder

1. Create `src/seeders/foo.ts`:

```ts
import type { Seeder } from "../core/types";

export const fooSeeder: Seeder = {
  name: "foo",
  description: "...",
  tags: ["fixtures"],
  envs: ["local"],            // optional, defaults to all
  dependsOn: ["plans"],       // optional, topological order
  async hash(ctx) { return "v1"; },
  async run(ctx) { /* use ctx.db, ctx.r2, ctx.kv, ctx.jobs */ },
};
```

2. Register it in `src/seeders/_index.ts`.

## Production safety

`--env=production --remote` requires:
- `SEED_ALLOW_REMOTE=1` in env
- `--yes` flag

Without both, the CLI exits non-zero.
