# Cloudflare

Provisioning and operating the CF resources used by `apps/api`, `apps/app`, `apps/landing`.

## Bindings (apps/api)

| Binding   | Type      | Purpose                                    |
| --------- | --------- | ------------------------------------------ |
| `DB`      | D1        | Primary SQLite (Drizzle)                   |
| `OBJECTS` | R2 bucket | User uploads, generated artifacts          |
| `CACHE`   | KV        | Short-TTL cache (rate limit, leaderboards) |
| `JOBS`    | Queue     | Async work (emails, batch processing)      |

Configured in `apps/api/wrangler.toml` per env (top-level = local dev, `[env.staging.*]`, `[env.production.*]`). Typed once in `apps/api/src/lib/bindings.ts` (`AppBindings`).

## First-time provisioning

```bash
bunx wrangler login

cd apps/api

# D1
bunx wrangler d1 create retardmaxxing-db
bunx wrangler d1 create retardmaxxing-db-staging

# R2
bunx wrangler r2 bucket create retardmaxxing-objects
bunx wrangler r2 bucket create retardmaxxing-objects-staging

# KV
bunx wrangler kv namespace create CACHE
bunx wrangler kv namespace create CACHE --env staging

# Queues
bunx wrangler queues create retardmaxxing-jobs
bunx wrangler queues create retardmaxxing-jobs-staging
```

Each command prints the resource id. Paste it into the corresponding `database_id` / `id` / `bucket_name` field in `wrangler.toml`. The default file ships with `"TBD"` placeholders.

## Secrets

Never commit `.dev.vars`. Local: copy from `.dev.vars.example`. Remote:

```bash
bunx wrangler secret put GOOGLE_CLIENT_SECRET --env production
bunx wrangler secret put APPLE_PRIVATE_KEY --env production
```

OAuth client IDs (non-secret) can live in `wrangler.toml` `[vars]`.

## Migrations (D1)

```bash
# generate from drizzle schema
bun run --cwd packages/database db:generate

# apply local
cd apps/api && bunx wrangler d1 migrations apply retardmaxxing-db --local

# apply remote staging
cd apps/api && bunx wrangler d1 migrations apply retardmaxxing-db-staging --remote --env staging

# apply remote production (after staging validated)
cd apps/api && bunx wrangler d1 migrations apply retardmaxxing-db --remote --env production
```

CI runs the staging migrate automatically (`.github/workflows/deploy.yml#migrate`). Production deploy is a manual workflow_dispatch.

## Local dev

`apps/api`:

```bash
cd apps/api && bunx wrangler dev --persist-to ../../.wrangler/state
```

State lives at `.wrangler/state/` — bindings persist across restarts. Delete the dir to reset.

`apps/app` (vinext) hits the API at `localhost:8787` by default. Override with `NEXT_PUBLIC_API_URL`.

## Deploy

```bash
# api
cd apps/api && bunx wrangler deploy --env production

# app (vinext + Workers Assets)
cd apps/app && bun deploy

# landing (Astro static + CF Pages)
cd apps/landing && bun deploy
```

Or via GitHub Actions: any push to `main` triggers `.github/workflows/deploy.yml` (production by default; staging via `workflow_dispatch`).

## Limits to remember

- **D1**: 500 MB per database. Shard by feature if you outgrow it.
- **Workers**: 50ms CPU on free, 30s on paid. Awilix container build is fast (~1ms).
- **Queues**: requires Workers Paid plan. Producer + consumer share bindings.
- **Send Email**: paid plan + DKIM/SPF onboarding in dashboard.

## Observability

`[observability]` is `enabled = true` in `wrangler.toml` — logs land in the Workers dashboard. `apps/api/src/lib/logger.ts` emits structured JSON; tail with `wrangler tail`.

For metrics beyond what CF gives, add an Analytics Engine binding and instrument in middleware.
