# retardmaxxing

Cloudflare-first monorepo boilerplate — web + mobile + landing, backed by a single Workers API with D1/R2/KV/Queues.

**Stack**

| Layer            | Tech                                                                  |
| ---------------- | --------------------------------------------------------------------- |
| Orchestration    | Moon 1.x + Bun 1.3.11 (workspaces + catalogs)                         |
| Backend          | Cloudflare Workers + Hono 4 + tRPC 11 + Awilix DI                     |
| Bindings         | D1, R2, KV, Queues (producer + consumer)                              |
| ORM              | Drizzle + drizzle-kit (driver `d1-http`)                              |
| Web app          | vinext + Vite 8 + RSC + `@cloudflare/vite-plugin`                     |
| Landing          | Astro 5 + Tailwind v4 + sitemap                                       |
| Mobile           | Expo 55 + expo-router (typed routes) + EAS                            |
| Mobile ↔ API     | tRPC client + HMAC integrity + dynamic Metro hostUri                  |
| Auth             | Oslo + Arctic (Google + Apple), cookies (web) / SecureStore (mobile)  |
| UI (web)         | shadcn (Radix + Tailwind v4) — `packages/ui` (~70 components)         |
| UI (mobile)      | Shopify Restyle + nativewind (Tailwind v4) — `packages/ui-native`     |
| Lint / format    | Biome                                                                 |
| Hooks            | Lefthook (biome on commit, typecheck on push)                         |
| Tests            | Vitest                                                                |

---

## Layout

```
retardmaxxing/
├── apps/
│   ├── api/          Hono + tRPC + Awilix on Workers (D1/R2/KV/Queues + HMAC integrity)
│   ├── app/          vinext + Vite RSC + Cloudflare (authenticated app)
│   ├── landing/      Astro 5 (marketing / SEO)
│   ├── mobile/       Expo + expo-router (HMAC-signed tRPC client)
│   └── storybook/    Component playground for packages/ui
├── packages/
│   ├── auth/         Oslo session adapter, Arctic OAuth, HMAC sign/verify
│   ├── billing/      Stripe SDK + plan/subscription helpers
│   ├── config/       Shared tsconfigs (base/web/workers/node/native) + vitest
│   ├── contract/     Zod schemas + types (client-safe — server only via re-export)
│   ├── database/     Drizzle schema, drizzle.config (d1-http), migrations/
│   ├── domains/      Pure business logic (browser + server safe)
│   ├── emails/       React Email templates
│   ├── i18n/         i18next config + locales
│   ├── notifications/ Push / email / SMS dispatch
│   ├── seed/         Extensible CLI seeder (per-environment, plugin system)
│   ├── ui/           shadcn components (Radix + Tailwind v4)
│   └── ui-native/    Restyle + nativewind components for mobile
├── .moon/            workspace.yml · tasks.yml · toolchain.yml
├── biome.json
├── bunfig.toml       exact pin, isolated linker
├── lefthook.yml
├── package.json      workspaces + catalogs (trpc/cloudflare/frontend/mobile/...)
├── tsconfig.json     project references
├── CLAUDE.md         agent / LLM instructions (read this if you're an LLM)
└── README.md
```

---

## Prerequisites

- **Bun ≥ 1.3.11** — `curl -fsSL https://bun.sh/install | bash`
- **Node ≥ 22** (only required for Wrangler internals on some machines)
- **Wrangler** — installed automatically via the workspace; otherwise `bun add -g wrangler`
- **Cloudflare account** with Workers Paid plan (Queues + D1 remote require it)
- **Xcode / Android Studio** (only if you build mobile)
- **EAS account** (only if you ship the mobile app)

---

## First-time bootstrap

> **Recommended path**: open the repo in Claude Code and run `/onboarding`. The wizard asks for your project name, lets you remove the parts of the boilerplate you don't need (mobile, landing, storybook, Cypress, Maestro, individual CF bindings, OAuth providers, optional packages, CI, lefthook), renames every reference to the slug you choose, and runs `bun install` + typecheck for you. Defaults are everything-on; you only confirm what to drop.
>
> The manual steps below are the equivalent if you're not using Claude Code.

```bash
# 1. Install dependencies (workspaces + catalog resolution)
bun install

# 2. Install git hooks (biome on commit, typecheck on push)
bunx lefthook install

# 3. Sync Moon project graph
bunx moon sync projects

# 4. API secrets — fill in OAuth credentials
cp apps/api/.dev.vars.example apps/api/.dev.vars
$EDITOR apps/api/.dev.vars

# 5. Cloudflare login
bunx wrangler login

# 6. Provision D1 / R2 / KV / Queues (see "Cloudflare provisioning" below)
```

---

## Cloudflare provisioning

`apps/api/wrangler.toml` ships with `database_id = "TBD"` placeholders. Replace them after running:

```bash
cd apps/api

# D1
bunx wrangler d1 create retardmaxxing-db
bunx wrangler d1 create retardmaxxing-db-staging

# KV
bunx wrangler kv namespace create CACHE
bunx wrangler kv namespace create CACHE --env staging

# R2
bunx wrangler r2 bucket create retardmaxxing-objects
bunx wrangler r2 bucket create retardmaxxing-objects-staging

# Queues
bunx wrangler queues create retardmaxxing-jobs
bunx wrangler queues create retardmaxxing-jobs-staging
```

Paste the returned IDs into `apps/api/wrangler.toml` (each `database_id`, `id`, etc.).

For production secrets:
```bash
bunx wrangler secret put GOOGLE_CLIENT_SECRET --env production
bunx wrangler secret put APPLE_PRIVATE_KEY --env production
# ... etc
```

---

## Database (Drizzle + D1)

Schema lives in `packages/database/src/schema.ts`. Migrations are referenced by `apps/api/wrangler.toml` (`migrations_dir = "../../packages/database/migrations"`).

```bash
# 1. Edit packages/database/src/schema.ts

# 2. Generate SQL migrations
bun run --cwd packages/database db:generate

# 3. Apply locally (miniflare-backed sqlite under .wrangler/state)
cd apps/api && bunx wrangler d1 migrations apply retardmaxxing-db --local

# 4. Apply remote staging
cd apps/api && bunx wrangler d1 migrations apply retardmaxxing-db-staging --remote --env staging

# 5. Apply remote production (after review)
cd apps/api && bunx wrangler d1 migrations apply retardmaxxing-db --remote --env production
```

For `db:studio` (web GUI) or HTTP-driver tasks, set:
```
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_DATABASE_ID=...
CLOUDFLARE_D1_TOKEN=...
```

---

## Seeders (`packages/seed`)

Extensible CLI for per-environment seeding. **No content generation** (no LLM/audio/image) — pure structural fixtures: subscription plans, demo users, lookup tables, etc.

```bash
bun seed list                                  # show registered seeders
bun seed run --env=local                       # run all (idempotent — hash-cached)
bun seed run --env=local --force               # ignore cache
bun seed run --env=local --dry-run             # plan only
bun seed run --only plans demo-users           # subset
bun seed run --tag subscription                # by tag
bun seed status --env=local                    # last-run per seeder
bun seed reset --env=local [--only plans]     # clear cache

# Production safety: requires SEED_ALLOW_REMOTE=1 + --yes
SEED_ALLOW_REMOTE=1 bun seed run --env=production --remote --yes
```

Add a seeder by dropping a file in `packages/seed/src/seeders/` and registering it in `_index.ts`. See `packages/seed/README.md` for the `Seeder` interface.

---

## Dev servers

Run each in its own terminal — they don't auto-coordinate.

```bash
# API (Workers, port 8787)
cd apps/api && bunx wrangler dev --persist-to ../../.wrangler/state

# Web app (vinext, port 3001)
cd apps/app && bun dev

# Landing (Astro, port 3002)
cd apps/landing && bun dev

# Mobile (Expo Metro)
cd apps/mobile && bun start
# then press i (iOS sim) or scan the QR
```

For the mobile app on a **physical device**, Metro derives the LAN IP from `Constants.expoConfig.hostUri` so the tRPC client points to your Mac's IP, not localhost. Make sure phone + Mac are on the same Wi-Fi.

---

## Deploy

```bash
# API
cd apps/api && bunx wrangler deploy --env staging
cd apps/api && bunx wrangler deploy --env production

# Web app (vinext)
cd apps/app && bun deploy

# Landing
cd apps/landing && bun deploy

# Mobile
cd apps/mobile && bunx eas build --profile production
cd apps/mobile && bunx eas submit --profile production
```

---

## Lint / Typecheck / Test

```bash
bun run lint           # biome check across all projects
bun run lint:fix       # biome check --unsafe --write
bun run typecheck      # tsc --noEmit (Moon respects ^:typecheck deps)
bun run test           # vitest run in every project that has a vitest.config.ts
bun run format         # biome format
bun run ci             # full Moon CI graph
```

Pre-commit (Lefthook):
- biome check --write on staged files
Pre-push:
- typecheck

Bypass only as a last resort: `git commit --no-verify`.

---

## Catalog versions

All shared dependencies live in root `package.json` `catalogs.*`. Bump there once, every package picks it up. Catalogs:

- `trpc` — @trpc/{server,client}, @hono/trpc-server
- `cloudflare` — wrangler, hono, drizzle, awilix, @cloudflare/{workers-types,vite-plugin}
- `frontend` — react, vite, vinext, tailwind v4, @tanstack/react-query, lucide-react
- `landing` — astro, @astrojs/{cloudflare,sitemap}
- `mobile` — expo, expo-router, expo-secure-store, react-native, nativewind, @shopify/restyle
- `auth` — @oslojs/{crypto,encoding}, arctic
- `validation` — zod, drizzle-zod, i18next, react-i18next
- `cli` — commander, @clack/prompts, yaml, p-limit
- `crypto` — @noble/hashes, @paralleldrive/cuid2
- `testing` — vitest, @cloudflare/vitest-pool-workers, @testing-library/*, msw, cypress

---

## Auth flow (mobile)

```
Apple/Google native sign-in
      ↓ (authorization code)
tRPC: auth.signInWithProvider
      ↓
API verifies code with Arctic, upserts user + identity
      ↓
Returns { token, userId, signingKey, expiresAt }
      ↓
Mobile saves to SecureStore (apps/mobile/lib/secure-store.ts)
      ↓
Every subsequent tRPC call → buildIntegrityHeaders signs
   METHOD\nPATH\nTIMESTAMP\nBODY  with signingKey
      ↓
API integrity middleware verifies HMAC, rejects on skew > 5 min
      ↓
ctx.userId set in tRPC context
```

Web does not use the HMAC flow — cookie-session-based auth (TODO: wire `/auth/callback` route in `apps/app`).

---

## Troubleshooting

- **`bun install` fails on `vinext`** — vinext is pinned to `latest` in catalogs. If a release is broken, pin a commit SHA: `"vinext": "github:cloudflare/vinext#<sha>"`.
- **Mobile can't reach API** — confirm phone + Mac on same Wi-Fi. Check `console.log(apiUrl)` in `apps/mobile/lib/trpc-client.ts`. Or override with `EXPO_PUBLIC_API_URL`.
- **HMAC 401 on every request** — clock skew. Mobile and Mac must be within 5 min. Check `Date.now()` on both.
- **Drizzle types empty** — re-run `bun install`; package may not be linked in workspace.
- **Wrangler "TBD" id error** — provisioning step skipped. See "Cloudflare provisioning" above.

---

## What's intentionally **not** included

- CI GitHub Actions
- LLM/audio/image generation in seeders (CLI is plumbing only)
- Playwright (Cypress covers web e2e, Maestro covers mobile)
- Sentry / observability beyond Cloudflare's built-in `[observability]`

Add as needed.
