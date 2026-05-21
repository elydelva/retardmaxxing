# Backend architecture

The API at `apps/api` follows a strict **repository / service / router** layering with Awilix DI. Every feature module looks the same. **Don't deviate.**

## Layout

```
apps/api/src/
├── index.ts                    Hono entrypoint, mounts middleware + tRPC
├── lib/
│   ├── bindings.ts             AppBindings (CF env shape)
│   └── logger.ts               Logger interface + impls
├── container/
│   ├── cradle.ts               AppCradle interface — every DI key listed
│   ├── container.ts            buildContainer(env) — wires everything
│   └── register/
│       ├── users.ts            registerUsers(c)
│       └── auth.ts             registerAuth(c)
├── trpc/
│   ├── context.ts              makeContext, router/publicProcedure/protectedProcedure
│   └── root.ts                 appRouter (compose all *.router.ts)
├── middleware/
│   └── integrity.ts            HMAC verify for mobile clients
└── modules/
    ├── users/
    │   └── users.repo.ts       all SQL for users/identities/sessions
    └── auth/
        ├── auth.service.ts     business logic (signUp/signIn/...)
        └── auth.router.ts      thin tRPC procedures
```

## The three layers

### 1. Repository — `<feature>.repo.ts`

**Owns:** all SQL for one entity (or a tight cluster like users + identities + sessions).
**Doesn't own:** business rules, errors, hashing, side effects.

Pattern: a factory function returning a typed interface. **No classes.**

```ts
export interface UsersRepo {
  findByEmail(email: string): Promise<User | null>;
  insertUser(values: NewUser): Promise<void>;
  // ...
}

export function createUsersRepo({ db }: { db: Database }): UsersRepo {
  return {
    async findByEmail(email) {
      return (await db.select().from(users).where(eq(users.email, email)).get()) ?? null;
    },
    async insertUser(values) {
      await db.insert(users).values(values);
    },
  };
}
```

**Conventions**

- Returns `null` for "not found" — never throw.
- Lets DB constraint violations propagate (the service translates them).
- Receives `db` only via `{ db }` destructure (Awilix injects).
- Types are inferred from Drizzle schema (`User`, `NewUser`).
- One repo per entity cluster — don't merge unrelated entities.

### 2. Service — `<feature>.service.ts`

**Owns:** business rules, error translation, side effects (other services), hashing, token generation.
**Doesn't own:** SQL (calls the repo), HTTP (the router does that).

```ts
export interface AuthService {
  signUp(input: SignUpInput): Promise<AuthSessionDto>;
}

export interface AuthServiceDeps {
  db: Database;
  env: AppBindings;
  usersRepo: UsersRepo;
  logger: Logger;
}

export function createAuthService(deps: AuthServiceDeps): AuthService {
  const { usersRepo, logger } = deps;
  return {
    async signUp({ email, password, name }) {
      const existing = await usersRepo.findByEmail(email);
      if (existing) throw new TRPCError({ code: "CONFLICT" });
      // ... hash password, insert, issue session
    },
  };
}
```

**Conventions**

- Throws `TRPCError` only — never custom error classes.
- Catches DB errors and translates by string match (`UNIQUE constraint` → `CONFLICT`).
- Composes multiple repos and other services. Receives them via deps.
- Returns DTOs (plain objects suitable for JSON), never raw DB rows.
- Logs at `info` for state changes, `error` for unexpected failures.

### 3. Router — `<feature>.router.ts`

**Owns:** input validation (Zod from `@retardmaxxing/contract`), procedure shape (mutation vs query), auth guard (`protectedProcedure` vs `publicProcedure`).
**Doesn't own:** anything else. Body should be one line.

```ts
export const authRouter = router({
  signUp: publicProcedure
    .input(SignUpInput)
    .mutation(({ ctx, input }) => ctx.cradle.authService.signUp(input)),

  me: protectedProcedure.query(({ ctx }) => ({ userId: ctx.userId })),
});
```

**Conventions**

- Inputs come from `@retardmaxxing/contract` — never inline Zod schemas in the router.
- Body is `ctx.cradle.<service>.<method>(input)`. Anything else is a smell.
- Mount the router in `trpc/root.ts`.

## DI with Awilix

`buildContainer(env)` in `container/container.ts` constructs a fresh per-request container.

- **`asValue`** for request-scoped values (`env`, `db`, `logger`, `userId`).
- **`asFunction(factory).scoped()`** for repos and services.

Every module has a `register/<feature>.ts` that registers its repos + services. `buildContainer` calls each `registerX(c)`.

To add a new service that depends on others, list them in `Deps`. Awilix resolves by parameter name:

```ts
// service expects { usersRepo, logger } — Awilix matches names from cradle
export function createAuthService(deps: AuthServiceDeps): AuthService { ... }
```

Cradle entries are listed in `container/cradle.ts`. **Add yours there or it won't typecheck.**

## Middleware

- **CORS** — `hono/cors`, applied globally.
- **Container** — wraps every request, attaches `c.get("container")`.
- **Integrity** (`middleware/integrity.ts`) — verifies HMAC headers from mobile clients, sets `userId` in the cradle. Web requests without those headers pass through with `userId = null`.

## Adding a module

See [adding-a-feature.md](./adding-a-feature.md).

## Why this shape

- **Repo factories not classes** → trivial fakes for unit tests; `createFakeUsersRepo({ findByEmail: async () => mockUser })`.
- **Service composes repos** → testable in isolation, no DB.
- **Router is thin** → no logic to test in HTTP context; everything is in the service.
- **Awilix scoped** → per-request lifetimes free; no leaking state between requests.
- **Cradle typed** → autocomplete for `ctx.cradle.x`, refactors safe.
