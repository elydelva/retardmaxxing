---
description: Interactive onboarding — rename + cleanup the boilerplate to fit the project.
---

# /onboarding — Boilerplate cleanup wizard

You are running the onboarding wizard. The boilerplate ships **everything enabled by default** (mobile, landing, storybook, e2e (Cypress), all CF bindings, all packages, CI workflows, Maestro). Your job is to:

1. Ask the user the project name + display.
2. Ask which **default features they want to remove** (multi-select cleanup).
3. Apply renaming everywhere.
4. Delete unwanted directories / config blocks / dependencies.
5. Bootstrap (`bun install`, `lefthook install`, `moon sync`, typecheck).

The mental model is **subtractive** — the user only confirms what they don't need.

---

## Phase 0 — Pre-flight

Verify:

- Working dir is the boilerplate root (root `package.json` `name` === `"retardmaxxing"`).
- `node_modules/` does NOT exist (or warn the user that re-running may break things).
- This `.claude/commands/onboarding.md` file exists (you're running from it).

If any check fails, ask the user before proceeding.

---

## Phase 1 — Identity (use `AskUserQuestion`, one call per question)

### Q1 — Project slug

```
question:    "Project slug? (lowercase, kebab-case, used in @<slug>/api etc.)"
header:      "Slug"
multiSelect: false
```

Suggest 2–3 plausible options derived from the parent directory name. Always allow "Other" for free input. Validate against `^[a-z][a-z0-9-]{1,40}$`. If invalid, re-ask.

### Q2 — Display name

```
question:    "Human-readable display name? (titles, app.json, README)"
header:      "Display name"
multiSelect: false
```

Recommend a Title-cased version of the slug. Allow "Other".

---

## Phase 2 — Cleanup (multi-select removals)

For each question below, the **default mental state is "keep everything"**. The user picks the items they want to **remove**. If they pick nothing, nothing is removed.

### Q3 — Apps to remove

```
question:    "Which apps do you want to REMOVE? (api + app are required and not listed)"
header:      "Remove apps"
multiSelect: true
```

Options:
- `"Mobile (Expo)"`
- `"Landing (Astro)"`
- `"Storybook"`
- `"Cypress e2e (apps/app/e2e)"`

### Q4 — Cloudflare bindings to remove

```
question:    "Which CF bindings do you want to REMOVE from wrangler.toml? (D1 is required and not listed)"
header:      "Remove bindings"
multiSelect: true
```

Options:
- `"R2 (object storage)"`
- `"KV (cache)"`
- `"Queues (producer + consumer)"`

### Q5 — OAuth providers to remove

```
question:    "Which OAuth providers do you want to REMOVE from packages/auth + apps/api/modules/auth?"
header:      "Remove OAuth"
multiSelect: true
```

Options:
- `"Google"`
- `"Apple"`

If the user removes both, also strip the `arctic` dependency and replace `signInWithProvider` with a `NOT_IMPLEMENTED` stub.

### Q6 — Shared packages to remove

```
question:    "Which optional packages do you want to REMOVE?"
header:      "Remove packages"
multiSelect: true
```

Options:
- `"i18n"`
- `"emails"`
- `"domains"`

(`auth`, `config`, `contract`, `database`, `seed`, `ui` are required — not listed.)

### Q7 — Tooling to remove

```
question:    "Which tooling do you want to REMOVE?"
header:      "Remove tooling"
multiSelect: true
```

Options:
- `"GitHub Actions CI (.github/workflows/)"`
- `"Maestro mobile e2e (apps/mobile/.maestro/)"`
- `"Lefthook git hooks"`

(Removing Mobile in Q3 also removes Maestro automatically — note this if both are picked.)

---

## Phase 3 — Confirm

Echo a summary table:

| Field         | Value                                                                  |
|---------------|------------------------------------------------------------------------|
| Slug          | `<slug>`                                                               |
| Display       | `<Display>`                                                            |
| Apps kept     | api, app, [mobile?, landing?, storybook?] · cypress?                    |
| Bindings kept | D1, [R2?, KV?, Queues?]                                                |
| OAuth kept    | [Google?, Apple?] or "none"                                            |
| Packages kept | auth, config, contract, database, seed, ui, [i18n?, emails?, domains?] |
| Tooling kept  | Biome, [CI?, Maestro?, Lefthook?]                                      |

Then ask:

```
question:    "Apply these changes?"
header:      "Confirm"
multiSelect: false
options:     [{ label: "Apply" }, { label: "Cancel" }]
```

If "Cancel" → stop, no changes.

---

## Phase 4 — Renaming pass

Run a **single global token replacement** in this exact order. Use `Bash` with `find … -type f … -exec sed -i '' …` (macOS sed). Skip `.git/`, `node_modules/`, `.wrangler/`, `dist/`, `.expo/`, `.moon/cache/`, AND this onboarding file (`.claude/commands/onboarding.md`).

1. `@retardmaxxing/`            → `@<slug>/`
2. `retardmaxxing-`             → `<slug>-`     (catches wrangler resource names: `retardmaxxing-api`, `retardmaxxing-db`, `retardmaxxing-objects`, `retardmaxxing-jobs`)
3. `retardmaxxing.com`          → `<slug>.com`
4. `com.retardmaxxing.app`      → `com.<slug>.app`
5. `retardmaxxing.`             → `<slug>.`     (only meaningful in `apps/mobile/lib/secure-store.ts` `KEY_*` constants; do steps 3+4 first or they'd be munged)
6. bare `retardmaxxing`         → `<slug>`      (root pkg name, Astro page title, mobile app.json `name`/`slug`/`scheme`, Maestro `appId`, API `/` JSON response)
7. `Retardmaxxing`              → `<DisplayName>`  (README headings, CLAUDE.md, layout.tsx metadata.title, i18n `app.title`)

**Sanity check** after all 7 passes:

```bash
rg -l "retardmaxxing" . --glob '!node_modules' --glob '!.git' --glob '!.claude/commands/onboarding.md'
```

Should print nothing. If anything remains, fix it manually before continuing.

---

## Phase 5 — Apply removals

For each removal selected in Phase 2, run the actions below in this order (later steps depend on earlier deletions).

### If "Mobile" removed
- `rm -rf apps/mobile`
- Edit `.moon/workspace.yml`: remove `mobile:` line.
- Edit root `tsconfig.json`: remove `apps/mobile` reference if present.
- Edit `.github/workflows/e2e.yml`: remove the `maestro` job entirely (or delete the file if Cypress also removed).
- Maestro is auto-removed since it lives inside `apps/mobile/.maestro`.

### If "Landing" removed
- `rm -rf apps/landing`
- Edit `.moon/workspace.yml`: remove `landing:` line.
- Edit root `tsconfig.json`: remove `./apps/landing` reference.
- Edit `.github/workflows/deploy.yml`: remove `deploy-landing` job.

### If "Storybook" removed
- `rm -rf apps/storybook`
- Edit `.moon/workspace.yml`: remove `storybook:` line.
- Edit root `tsconfig.json`: remove the reference.

### If "Cypress e2e" removed
- `rm -rf apps/app/e2e apps/app/cypress.config.ts`
- Edit root `tsconfig.json`: remove `./apps/app/e2e` reference.
- Edit `apps/app/tsconfig.json`: drop `"e2e"` and `"cypress.config.ts"` from `exclude`.
- Edit `apps/app/package.json`: remove `e2e` + `e2e:open` scripts and the `cypress` devDep.
- Edit `.github/workflows/e2e.yml`: remove the `cypress` job (or delete the file if Maestro also removed).
- Remove `cypress` and `wait-on` from root `package.json` `catalogs.testing`.

### If "R2" removed
- Edit `apps/api/wrangler.toml`: delete every `[[r2_buckets]]` and `[[env.staging.r2_buckets]]` and `[[env.production.r2_buckets]]` block.
- Edit `apps/api/src/lib/bindings.ts`: remove `OBJECTS: R2Bucket;` and the import.

### If "KV" removed
- Edit `apps/api/wrangler.toml`: delete every `[[kv_namespaces]]` block (top-level + each env).
- Edit `apps/api/src/lib/bindings.ts`: remove `CACHE: KVNamespace;`.

### If "Queues" removed
- Edit `apps/api/wrangler.toml`: delete every `[[queues.producers]]` and `[[queues.consumers]]` block (top-level + each env).
- Edit `apps/api/src/lib/bindings.ts`: remove `JOBS: Queue;`.

### If "Google OAuth" removed
- Edit `packages/auth/src/providers.ts`: remove `Google` import + `googleClient` function + `GOOGLE_*` fields from `ProviderEnv`.
- Edit `apps/api/src/modules/auth/router.ts`: remove the `if (input.provider === "google")` branch.
- Edit `apps/api/src/lib/bindings.ts`: remove `GOOGLE_*` env fields.
- Edit `apps/api/.dev.vars.example`: remove `GOOGLE_*` lines.
- Edit `packages/contract/src/auth.ts`: remove `"google"` from `ProviderSchema` enum.

### If "Apple OAuth" removed
- Same as Google but for Apple (`appleClient`, `APPLE_*`, `Apple` import).

### If both OAuth providers removed
- Replace the whole `signInWithProvider` mutation in `apps/api/src/modules/auth/router.ts` with a stub that throws `TRPCError({ code: "NOT_IMPLEMENTED" })`.
- Remove `arctic` from `packages/auth/package.json` and root `catalogs.auth`.
- Delete `packages/auth/src/providers.ts`.

### If "i18n" / "emails" / "domains" removed
- `rm -rf packages/<name>`
- Edit `.moon/workspace.yml` + root `tsconfig.json`: remove references.
- Grep for `@<slug>/<name>` and remove from any `dependencies` blocks.

### If "GitHub Actions CI" removed
- `rm -rf .github`

### If "Maestro" removed (and mobile kept)
- `rm -rf apps/mobile/.maestro`
- Edit `.github/workflows/e2e.yml`: remove the `maestro` job (or delete the file if also no Cypress).

### If "Lefthook" removed
- `rm -f lefthook.yml`
- Remove `lefthook` from root `package.json` devDependencies.
- Remove the `prepare` script from root `package.json`.

---

## Phase 6 — Bootstrap

Run sequentially — each must succeed:

```bash
bun install
[ -f lefthook.yml ] && bunx lefthook install
bunx moon sync projects
bun run --cwd packages/database db:generate || true   # empty schema OK
bun run lint || true                                   # warn, don't fail
bun run typecheck                                       # MUST pass
```

If `bun install` fails on `vinext` or Expo SDK versions, advise pinning specific versions in catalogs and re-run.

If typecheck fails after cleanup, **don't loop** — print the errors, ask the user whether to fix interactively or proceed and address later.

---

## Phase 7 — Final report

Print:

```
✅ <slug> ready

Removed:     [list]
Kept apps:   api, app, [mobile, landing, storybook] · cypress?
Bindings:    D1, [R2, KV, Queues]
OAuth:       [Google, Apple, none]
Packages:    auth, config, contract, database, seed, ui, [i18n, emails, domains]
Tooling:     Biome, [CI, Maestro, Lefthook]

Next steps:
  1. cp apps/api/.dev.vars.example apps/api/.dev.vars  (fill OAuth secrets if kept)
  2. bunx wrangler login
  3. Provision D1/[KV/R2/Queues] — see README "Cloudflare provisioning"
  4. cd apps/api && bunx wrangler dev
  5. cd apps/app && bun dev
  [if mobile] 6. cd apps/mobile && bun start

Optional:
  - git init && git add . && git commit -m "init"
  - rm .claude/commands/onboarding.md  (this wizard — single-use)
```

---

## Constraints

- **Use `AskUserQuestion`** — never roll your own input loop.
- **One question per call** (don't bundle Q1–Q7).
- **`multiSelect: true` is mandatory** for Q3–Q7 (cleanup).
- **Validate the slug** against `^[a-z][a-z0-9-]{1,40}$`. Re-ask on invalid free-text.
- **Don't commit anything** — let the user run `git init` themselves.
- **Default = keep everything.** The user removes only what they explicitly pick.
- **Idempotency is not required** — onboarding is single-use. Phase 0 warns if re-run.
