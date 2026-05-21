# CLAUDE.md — Agent map

You are inside a **Moon + Bun monorepo** targeting **Cloudflare Workers** end-to-end. Read the doc that matches your task — don't read all of them.

## When to read what

| Your task                                          | Read                                                |
| -------------------------------------------------- | --------------------------------------------------- |
| Add an API feature (route + DB)                    | [docs/adding-a-feature.md](./docs/adding-a-feature.md) |
| Understand the API architecture / DI               | [docs/backend-architecture.md](./docs/backend-architecture.md) |
| Touch auth, sessions, password, HMAC, OAuth        | [docs/auth-flow.md](./docs/auth-flow.md)            |
| Stripe — checkout, subscriptions, portal, webhooks | [docs/stripe.md](./docs/stripe.md)                  |
| Push / email / SMS notifications                   | [docs/notifications.md](./docs/notifications.md)    |
| Mobile (Expo Router, Restyle, SF Symbols)          | [docs/mobile.md](./docs/mobile.md)                  |
| Write or run tests (unit/integration/RTL/Cypress/Maestro) | [docs/testing.md](./docs/testing.md)         |
| Add fixtures / per-env data                        | [docs/seeders.md](./docs/seeders.md)                |
| Provisioning, deploy, wrangler bindings            | [docs/cloudflare.md](./docs/cloudflare.md)          |

[docs/README.md](./docs/README.md) is the index.

## Mental model

```
apps/mobile (Expo, HMAC)  ─┐
apps/app    (vinext+RSC)   ├──► apps/api (Hono + tRPC + Awilix) ──► D1 / R2 / KV / Queues
apps/landing (Astro)       ─┘            ▲
                                         │
                            packages/{auth,contract,database,domains,emails,i18n,ui,...}
```

## Apps + packages — who owns what

| Path                            | Owns                                                                                |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| `apps/api`                      | Hono entry, tRPC router composition, middleware, DI container, repos + services    |
| `apps/app`                      | vinext routes (`app/`), RSC layouts, tRPC client, providers, Cypress specs        |
| `apps/landing`                  | Marketing pages, SEO, sitemap                                                       |
| `apps/mobile`                   | Expo routes, native UI, SecureStore session, HMAC sign on every request           |
| `apps/storybook`                | Component playground for `packages/ui`                                              |
| `packages/auth`                 | Oslo session adapter, Arctic OAuth, password (PBKDF2), HMAC sign/verify           |
| `packages/config`               | Shared `tsconfig.{base,web,workers,node,native}.json`, `vitest.base.ts`           |
| `packages/contract`             | Zod schemas + types — **client-safe** (no Drizzle, no Workers types)              |
| `packages/database`             | Drizzle schema, `createDb(d1)`, drizzle-kit config (d1-http), migrations          |
| `packages/domains`              | Pure business rules (e.g. plan limits) — browser + server safe                    |
| `packages/emails`               | React Email templates, `renderXxx → { subject, html, text }`                      |
| `packages/i18n`                 | i18next init + locales                                                             |
| `packages/seed`                 | Extensible seed CLI (Commander + @clack)                                          |
| `packages/ui`                   | shadcn components (Radix + Tailwind v4)                                           |

## Layering rules — enforce before merging

1. **Apps may import packages. Packages must not import apps.** (Exception: `apps/api` re-exports `./trpc` for clients.)
2. **`packages/contract` and `packages/domains` are client-safe.** No `drizzle-orm`, no `@cloudflare/workers-types`, no `node:*`.
3. **`packages/database` is server-only.** Never imported by `apps/app` or `apps/mobile` — they consume the API.
4. **`packages/ui` is web-only.** Mobile uses native components + nativewind.
5. **In `apps/api`, the layering is `repo → service → router`.** Routers don't query DB. Services don't open HTTP. Repos don't throw business errors.

If you're about to violate one, fix the import boundary first.

## tRPC conventions

- Inputs come from `@retardmaxxing/contract` — never inline Zod in a router.
- Routers are thin: `({ ctx, input }) => ctx.cradle.<service>.<method>(input)`.
- Use `protectedProcedure` for any route requiring `userId`.
- Throw `TRPCError` with standard codes — never custom error classes.
- superjson is the transformer (Date / Map / BigInt cross the wire intact).

## Drizzle conventions

- All tables in `packages/database/src/schema.ts`.
- IDs: `text("id").primaryKey()` with prefixed UUIDs (`u_`, `proj_`, etc.).
- Timestamps: `integer(..., { mode: "timestamp" }).$defaultFn(() => new Date())`.
- Enums: `text("col", { enum: ARRAY }).notNull()` plus `const ARRAY = [...] as const`.
- Foreign keys cascade by default: `.references(() => other.id, { onDelete: "cascade" })`.
- Migrations are committed (`packages/database/migrations/` is **not** gitignored).

## Code style

- **Biome** is the source of truth. `bun run lint:fix` before committing.
- 2-space indent, double quotes, semicolons, trailing commas (es5), 100-char line width.
- Default to no comments. Add one only when *why* is non-obvious.
- TypeScript strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`.
- Don't add backwards-compat shims for code you wrote in the same change.

## Tests = mandatory

Every feature lands with at least:

- 1 service unit test per branch in business logic (`apps/api/test/unit/`).
- 1 integration test if you touched SQL (`apps/api/test/integration/`).
- 1 component test if you added a non-trivial UI element (`apps/app/tests/components/`).

Cypress / Maestro are for major flows, not per-feature.

## Don't

- Roll your own DI helpers — Awilix already covers it.
- Bypass the cradle by `new Service(db)` inline. Use factories registered in `container/register/`.
- Add ESLint / Prettier — Biome is the only config.
- Add a `try/catch` to swallow errors. Translate them into `TRPCError`.
- `vi.mock` fetch in component tests — use MSW.

## When stuck

1. `rg "..." -t ts` to find similar code in the repo.
2. Mimic the closest existing module (e.g. base a new feature on `users` + `auth`).
3. Re-read the matching `docs/*.md`.
4. Ask the user before making cross-cutting changes (touching catalogs, layering, or auth flow).
