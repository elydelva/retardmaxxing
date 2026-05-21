# Testing

Five test surfaces. **Use the right one — they have different cost.**

| Layer                | Where                                    | Speed    | Tool                                |
| -------------------- | ---------------------------------------- | -------- | ----------------------------------- |
| Service unit         | `apps/api/test/unit/`                    | <100ms   | vitest (node) + fake repos          |
| Repo / tRPC integration | `apps/api/test/integration/`         | seconds  | vitest + `@cloudflare/vitest-pool-workers` (real D1) |
| Package unit         | `packages/<pkg>/src/*.test.ts`           | <100ms   | vitest                              |
| Web component        | `apps/app/tests/components/`             | <500ms   | vitest + happy-dom + RTL + MSW      |
| Web e2e              | `apps/app/e2e/specs/`                    | minutes  | Cypress (real API + app running)    |
| Mobile e2e           | `apps/mobile/.maestro/flows/`            | minutes  | Maestro (simulator)                 |

## Run

```bash
# everything
bun run test

# api only
bun run --cwd apps/api test
bun run --cwd apps/api test:unit
bun run --cwd apps/api test:integration

# web component tests
bun run --cwd apps/app test
bun run --cwd apps/app test:watch

# package
bun run --cwd packages/auth test

# Cypress (needs api + app running)
bun run --cwd apps/api dev &
bun run --cwd apps/app dev &
bun run --cwd apps/app e2e

# Maestro (needs app installed on simulator)
maestro test apps/mobile/.maestro/flows
```

## Service unit tests

**Goal**: prove business logic. **Don't** touch real DB. Use `createFakeUsersRepo` from `apps/api/test/helpers/fakes.ts`.

```ts
import { createAuthService } from "../../../src/modules/auth/auth.service";
import { createFakeUsersRepo, makeUser, silentLogger } from "../../helpers/fakes";

it("rejects duplicate email", async () => {
  const usersRepo = createFakeUsersRepo({
    findByEmail: async () => makeUser(),
  });
  const service = createAuthService({ usersRepo, /* ... */ });
  await expect(service.signUp(input)).rejects.toMatchObject({ code: "CONFLICT" });
});
```

**Conventions:**

- File name: `<feature>.<type>.unit.test.ts` (e.g. `auth.service.unit.test.ts`).
- Co-locate with the file under test in `test/unit/<feature>/`.
- Use `vi.spyOn` for assertion on call counts; pass plain async fns for return values.
- Never import Hono/tRPC server here — services don't know about HTTP.

## Integration tests (real D1)

**Goal**: prove SQL works. Use `applyMigrations()` once in `beforeAll`.

```ts
import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { createDb } from "@retardmaxxing/database";
import { createUsersRepo } from "../../src/modules/users/users.repo";
import { applyMigrations } from "../helpers/apply-migrations";

beforeAll(async () => {
  await applyMigrations();
});

it("inserts and finds a user", async () => {
  const repo = createUsersRepo({ db: createDb(env.DB) });
  await repo.insertUser({ /* ... */ });
  expect(await repo.findByEmail("...")).not.toBeNull();
});
```

**How it works**: `vitest.integration.config.ts` uses `defineWorkersProject` from `@cloudflare/vitest-pool-workers`. Each test file gets a fresh ephemeral SQLite (D1 in miniflare). `cloudflare:test` exposes `env.DB`, `env.OBJECTS`, etc.

**Conventions:**

- File name: `<feature>.<type>.int.test.ts` (e.g. `users.repo.int.test.ts`).
- Always `applyMigrations()` in `beforeAll`.
- Don't share state between files (the pool resets per file).
- Test ordering inside a file matters — D1 persists for the whole file.

## React component tests

`apps/app/tests/` — vitest + happy-dom + RTL + MSW.

```tsx
import { screen, waitFor } from "@testing-library/react";
import { renderWithQueryClient } from "../utils";
import { server } from "../msw/server";

it("shows loading then data", async () => {
  renderWithQueryClient(<HealthBadge />);
  await waitFor(() => expect(screen.getByTestId("health")).toHaveTextContent("ok"));
});

it("handles error response", async () => {
  server.use(http.get("...", () => HttpResponse.json({ ok: false })));
  renderWithQueryClient(<HealthBadge />);
  await waitFor(() => expect(screen.getByTestId("health")).toHaveTextContent("down"));
});
```

**Setup**:

- `tests/setup.ts` — registers `@testing-library/jest-dom/vitest` matchers, lifecycles MSW server.
- `tests/msw/{handlers,server}.ts` — handlers list + node server.
- `tests/utils.tsx` — `renderWithQueryClient` wraps with a fresh `QueryClient` per test.

**Conventions:**

- One file per component or hook. Co-located is OK if the file lives under `src/` (use `*.test.tsx`).
- MSW is the only mock layer for network. Don't `vi.mock` fetch.
- Use `data-testid` for elements you'll assert on. Avoid relying on text that may be translated.
- `cleanup()` runs automatically in `afterEach` — don't call it manually.

## Cypress (web e2e)

`apps/app/e2e/specs/`. Needs both API and app dev servers running.

```ts
describe("home", () => {
  it("renders the title", () => {
    cy.visit("/");
    cy.contains("retardmaxxing").should("be.visible");
  });
});
```

**Conventions:**

- Smoke tests only — happy paths and a couple of critical user journeys.
- Don't reach into `localStorage` to fake auth. Either run a real signin flow or stub at the network layer (`cy.intercept`).
- Keep specs <30s each.

## Maestro (mobile e2e)

`apps/mobile/.maestro/flows/*.yaml`. YAML-based, runs against installed simulator/device build.

```yaml
appId: com.retardmaxxing.app
---
- launchApp:
    clearState: true
- assertVisible: "retardmaxxing"
```

Run: `maestro test apps/mobile/.maestro/flows`

The mobile app must be **installed first**. CI is gated behind a signed iOS build (see `.github/workflows/e2e.yml#maestro`).

## What NOT to test

- Drizzle ORM internals — they're tested upstream.
- Zod schemas individually — exercise them via the service that uses them.
- Cloudflare bindings — assume they work; integration tests cover the SQL path.
- Component snapshots — they reward laziness and break on every CSS tweak.

## Adding tests when you add code

Every PR should land at minimum:

- 1 service unit test per new branch in business logic.
- 1 integration test if you changed SQL.
- 1 component test if you added a non-trivial UI element.

Cypress and Maestro are for major flows, not per-feature.
