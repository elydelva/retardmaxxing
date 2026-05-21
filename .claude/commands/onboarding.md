---
description: Interactive onboarding — rename + cleanup the boilerplate to fit the project.
---

# /onboarding — Boilerplate cleanup wizard

Boilerplate ships **everything enabled**. Wizard is **subtractive** — user picks what to remove. Default = keep.

Job:
1. Ask project slug + display name.
2. Multi-select removals (apps, bindings, OAuth, Stripe, notifications, packages, tooling).
3. Rename tokens repo-wide.
4. Delete selected dirs / config blocks / deps.
5. Bootstrap (`bun install`, `lefthook install`, `moon sync`, typecheck).

---

## Phase 0 — Pre-flight

- Root `package.json` `name` === `"retardmaxxing"`.
- `node_modules/` absent (else warn).
- This file exists (you're in it).

Fail → ask user before proceeding.

---

## Phase 1 — Identity (one `AskUserQuestion` per Q)

### Q1 — Slug
- Prompt: `"Project slug? (lowercase, kebab-case)"`
- Header: `Slug`
- Suggest 2–3 derived from parent dir. Allow Other.
- Validate `^[a-z][a-z0-9-]{1,40}$`. Re-ask on fail.

### Q2 — Display name
- Prompt: `"Human-readable name?"`
- Header: `Display name`
- Recommend Title-case of slug. Allow Other.

---

## Phase 2 — Cleanup (multi-select)

### Q3 — Apps to REMOVE
(`api`, `app` required — not listed)
- Mobile (Expo)
- Landing (Astro)
- Storybook
- Cypress e2e (`apps/app/e2e`)

### Q4 — CF bindings to REMOVE
(D1 required — not listed)
- R2 (object storage)
- KV (cache)
- Queues (producer + consumer)

### Q5 — OAuth providers to REMOVE
- Google
- Apple

Both removed → strip `arctic`, stub `signInWithProvider` with `NOT_IMPLEMENTED`.

### Q6 — Stripe (billing) — REMOVE?
- Stripe billing (checkout, subscriptions, portal, webhooks)

If removed: `rm -rf packages/billing`, drop `STRIPE_*` bindings + `.dev.vars.example` lines + any `@<slug>/billing` deps + Stripe router.

### Q7 — Notification channels to REMOVE
- Push (Expo)
- Email (Resend / `packages/emails`)
- SMS (Twilio)

All three removed → `rm -rf packages/notifications packages/emails` and drop `@<slug>/notifications` deps everywhere.

### Q8 — Shared packages to REMOVE
Required (not listed): `auth`, `config`, `contract`, `database`, `env`, `seed`, `ui`.
- i18n
- domains
- ui-native (mobile-only; auto-removed if Mobile removed)

### Q9 — Tooling to REMOVE
- GitHub Actions CI (`.github/workflows/`)
- Maestro mobile e2e (`apps/mobile/.maestro/`) — auto if Mobile removed
- Lefthook git hooks

---

## Phase 3 — Confirm

Echo summary table (Slug, Display, Apps kept, Bindings kept, OAuth kept, Stripe kept?, Notifications kept, Packages kept, Tooling kept).

Then `AskUserQuestion`: `[Apply, Cancel]`. Cancel → stop.

---

## Phase 4 — Rename pass

Single global replace, **in order**. Use `find … -type f … -exec sed -i '' …`. Skip: `.git/`, `node_modules/`, `.wrangler/`, `dist/`, `.expo/`, `.moon/cache/`, `.claude/commands/onboarding.md`.

1. `@retardmaxxing/`      → `@<slug>/`
2. `retardmaxxing-`       → `<slug>-`        (wrangler resource names: `-api`, `-db`, `-objects`, `-jobs`)
3. `retardmaxxing.com`    → `<slug>.com`
4. `com.retardmaxxing.app`→ `com.<slug>.app`
5. `retardmaxxing.`       → `<slug>.`        (only `apps/mobile/lib/secure-store.ts` `KEY_*`; do 3+4 first)
6. `retardmaxxing`        → `<slug>`         (root pkg, Astro title, mobile `app.json`, Maestro `appId`, API `/` JSON)
7. `Retardmaxxing`        → `<DisplayName>`  (READMEs, CLAUDE.md, layout metadata, i18n `app.title`)

Sanity:
```bash
rg -l "retardmaxxing" . --glob '!node_modules' --glob '!.git' --glob '!.claude/commands/onboarding.md'
```
Empty output expected. Fix leftovers manually.

---

## Phase 5 — Apply removals

Run in this order (later steps depend on earlier deletes).

### Mobile removed
- `rm -rf apps/mobile`
- `.moon/workspace.yml`: drop `mobile:` line
- Root `tsconfig.json`: drop `./apps/mobile` ref
- `.github/workflows/e2e.yml`: drop `maestro` job (or delete file if Cypress also gone)
- Auto-removes Maestro + flags `ui-native` for removal

### Landing removed
- `rm -rf apps/landing`
- `.moon/workspace.yml`: drop `landing:`
- Root `tsconfig.json`: drop ref
- `.github/workflows/deploy.yml`: drop `deploy-landing` job

### Storybook removed
- `rm -rf apps/storybook`
- `.moon/workspace.yml`: drop `storybook:`
- Root `tsconfig.json`: drop ref

### Cypress removed
- `rm -rf apps/app/e2e apps/app/cypress.config.ts`
- Root `tsconfig.json`: drop `./apps/app/e2e`
- `apps/app/tsconfig.json`: drop `"e2e"`, `"cypress.config.ts"` from `exclude`
- `apps/app/package.json`: drop `e2e`, `e2e:open` scripts + `cypress` devDep
- `.github/workflows/e2e.yml`: drop `cypress` job (or delete file)
- Root `package.json` `catalogs.testing`: drop `cypress`, `wait-on`

### R2 removed
- `apps/api/wrangler.toml`: drop every `[[r2_buckets]]` block (top + envs)
- `apps/api/src/lib/bindings.ts`: drop `OBJECTS: R2Bucket;` + import

### KV removed
- `apps/api/wrangler.toml`: drop every `[[kv_namespaces]]` block
- `apps/api/src/lib/bindings.ts`: drop `CACHE: KVNamespace;`

### Queues removed
- `apps/api/wrangler.toml`: drop every `[[queues.producers]]` + `[[queues.consumers]]`
- `apps/api/src/lib/bindings.ts`: drop `JOBS: Queue;`

### Google OAuth removed
- `packages/auth/src/providers.ts`: drop `Google` import + `googleClient` + `GOOGLE_*` from `ProviderEnv`
- `apps/api/src/modules/auth/router.ts`: drop `provider === "google"` branch
- `apps/api/src/lib/bindings.ts`: drop `GOOGLE_*`
- `apps/api/.dev.vars.example`: drop `GOOGLE_*`
- `packages/contract/src/auth.ts`: drop `"google"` from `ProviderSchema`

### Apple OAuth removed
Same as Google for `appleClient`, `APPLE_*`, `Apple` import.

### Both OAuth removed
- Replace `signInWithProvider` with `throw new TRPCError({ code: "NOT_IMPLEMENTED" })`
- `packages/auth/package.json` + root `catalogs.auth`: drop `arctic`
- `rm packages/auth/src/providers.ts`

### Stripe removed
- `rm -rf packages/billing`
- `apps/api/src/lib/bindings.ts`: drop `STRIPE_*`
- `apps/api/.dev.vars.example`: drop `STRIPE_*`
- `apps/api/src/modules/`: drop billing router + DI registration (look for `billing` cradle key)
- `.moon/workspace.yml`: drop `billing:` if listed
- Grep for `@<slug>/billing` deps, remove

### Push (Expo) removed
- `apps/api/src/lib/bindings.ts`: drop `EXPO_ACCESS_TOKEN`
- `apps/api/.dev.vars.example`: drop `EXPO_*`
- `packages/notifications/`: drop Expo push channel (keep package if email/sms kept)

### Email (Resend) removed
- `rm -rf packages/emails`
- `apps/api/src/lib/bindings.ts`: drop `RESEND_API_KEY`, `EMAIL_FROM`
- `apps/api/.dev.vars.example`: drop `RESEND_*`, `EMAIL_FROM`
- Grep for `@<slug>/emails` deps, remove
- `.moon/workspace.yml`: drop `emails:`

### SMS (Twilio) removed
- `apps/api/src/lib/bindings.ts`: drop `TWILIO_*`
- `apps/api/.dev.vars.example`: drop `TWILIO_*`
- `packages/notifications/`: drop Twilio channel

### All notifications removed
- `rm -rf packages/notifications`
- `.moon/workspace.yml`: drop `notifications:`
- Grep for `@<slug>/notifications` deps, remove

### i18n / domains removed
- `rm -rf packages/<name>`
- `.moon/workspace.yml` + root `tsconfig.json`: drop refs
- Grep for `@<slug>/<name>` deps, remove

### ui-native removed (mobile gone OR explicit)
- `rm -rf packages/ui-native`
- `.moon/workspace.yml`: drop if listed
- Grep for `@<slug>/ui-native` deps

### CI removed
- `rm -rf .github`

### Maestro removed (mobile kept)
- `rm -rf apps/mobile/.maestro`
- `.github/workflows/e2e.yml`: drop `maestro` job (or delete file if no Cypress)

### Lefthook removed
- `rm -f lefthook.yml`
- Root `package.json`: drop `lefthook` devDep + `prepare` script

---

## Phase 6 — Bootstrap

```bash
bun install
[ -f lefthook.yml ] && bunx lefthook install
bunx moon sync projects
bun run --cwd packages/database db:generate || true   # empty schema OK
bun run lint || true                                   # warn only
bun run typecheck                                       # MUST pass
```

`bun install` fails on `vinext` / Expo → pin specific versions in catalogs, re-run.

Typecheck fails → **don't loop**. Print errors, ask user: fix interactively or proceed.

---

## Phase 7 — Final report

```
✅ <slug> ready

Removed:     [list]
Kept apps:   api, app, [mobile, landing, storybook] · cypress?
Bindings:    D1, [R2, KV, Queues]
OAuth:       [Google, Apple, none]
Stripe:      [kept, removed]
Notify:      [push, email, sms, none]
Packages:    auth, config, contract, database, env, seed, ui, [billing, domains, emails, i18n, notifications, ui-native]
Tooling:     Biome, [CI, Maestro, Lefthook]

Next steps:
  1. cp apps/api/.dev.vars.example apps/api/.dev.vars  (fill secrets)
  2. bunx wrangler login
  3. Provision D1/[KV/R2/Queues] — see README "Cloudflare provisioning"
  4. cd apps/api && bunx wrangler dev
  5. cd apps/app && bun dev
  [if mobile] 6. cd apps/mobile && bun start

Optional:
  - git init && git add . && git commit -m "init"
  - rm .claude/commands/onboarding.md  (single-use)
```

---

## Constraints

- `AskUserQuestion` only — no custom input loops.
- One question per call.
- `multiSelect: true` for Q3–Q9.
- Slug regex: `^[a-z][a-z0-9-]{1,40}$`. Re-ask on invalid.
- Don't commit — user runs `git init`.
- Default = keep. Remove only what user picks.
- Single-use. Phase 0 warns on re-run.
