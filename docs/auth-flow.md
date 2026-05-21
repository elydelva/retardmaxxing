# Auth flow

Two parallel auth paths share the same `users` table.

## Email + password (web)

```
Client (web)                      apps/api                       D1
   │                                 │                            │
   │ tRPC auth.signUp                │                            │
   │  { email, password, name }      │                            │
   ├────────────────────────────────►│                            │
   │                                 │ usersRepo.findByEmail      │
   │                                 ├───────────────────────────►│
   │                                 │ ◄──── null ────────────────│
   │                                 │ hashPassword (PBKDF2 210k) │
   │                                 │ generateSigningKey         │
   │                                 │ usersRepo.insertUser       │
   │                                 ├───────────────────────────►│
   │                                 │ generateSessionToken       │
   │                                 │ createSession (oslo)       │
   │                                 ├───── insert sessions ─────►│
   │ ◄── { token, userId, signingKey, expiresAt } ────────────────┤
```

Implementation:

- **Hash**: `packages/auth/src/password.ts` — PBKDF2-SHA256, 210k iter, 32-byte key, 16-byte salt. Format `pbkdf2$<iter>$<saltB64>$<hashB64>`. Workers-safe (WebCrypto only).
- **Session token**: 20 random bytes → hex. Stored as SHA-256 hash in DB (`sessions.id`).
- **Signing key**: 32 random bytes → hex. Stored plaintext on the user row. Mobile uses it for HMAC; web ignores it.
- **Service**: `apps/api/src/modules/auth/auth.service.ts` — `signUp` and `signIn`.
- **Pre-check** before `INSERT` prevents most duplicates with a friendly error; the `UNIQUE constraint failed` race fallback in the catch translates to the same `CONFLICT` code.

## Mobile + HMAC integrity

Mobile flow piggybacks on email/password (or OAuth) signup, then signs every subsequent request:

```
Mobile                        apps/api                       SecureStore
  │                              │                              │
  │ auth.signUp / signIn         │                              │
  ├─────────────────────────────►│                              │
  │ ◄── { token, signingKey }────┤                              │
  │                              │                              │
  │ saveSession ─────────────────────────────────────────────►  │
  │                                                             │
  │ Subsequent tRPC call                                        │
  │   buildIntegrityHeaders(method, path, body)                 │
  │   reads signingKey from SecureStore  ◄──────────────────── │
  │   sig = HMAC-SHA256(key, "METHOD\nPATH\nTS\nBODY")         │
  │ ───── x-user-id, x-timestamp, x-signature ─────────────────►│
  │                              │                              │
  │                              │ integrityMiddleware:         │
  │                              │   usersRepo.findById         │
  │                              │   verifyRequest(skew ±5min)  │
  │                              │   container.register userId  │
```

Code:

- `apps/mobile/lib/integrity.ts` — `buildIntegrityHeaders(method, path, body)` reads from SecureStore and signs.
- `apps/mobile/lib/secure-store.ts` — `saveSession` / `loadSession` / `clearSession`.
- `apps/mobile/lib/trpc-client.ts` — `httpBatchLink.fetch` overrides to inject the headers.
- `apps/api/src/middleware/integrity.ts` — verifies, sets `userId` on the cradle.
- `packages/auth/src/hmac.ts` — `signRequest` / `verifyRequest`, constant-time compare.

The middleware is **non-blocking**: missing headers = `userId stays null` = web request. `protectedProcedure` rejects later if needed.

## OAuth (Google + Apple)

Currently scaffolded in `packages/auth/src/providers.ts` but **not wired into a router** yet. To enable:

1. Add a `signInWithProvider` mutation in `auth.router.ts` that:
   - Validates `code` + `state` (+ `codeVerifier` for Google).
   - Calls `googleClient(env).validateAuthorizationCode(...)` or Apple equivalent.
   - Decodes the ID token (`atob(idToken.split(".")[1])`).
   - `usersRepo.findByProviderIdentity` → upsert user + identity.
   - `issueSession` (same helper as `signUp`/`signIn`).
2. The web client kicks off the OAuth dance with redirect URLs configured in `apps/api/.dev.vars`.
3. Mobile uses `expo-auth-session` (Google) and `expo-apple-authentication` (Apple) to get the code, then calls the same mutation.

The cradle and service deps already include `env` so `googleClient(env)` works without further wiring.

## Session validation

`packages/auth/src/session.ts`:

- `createSession(db, userId, token)` — inserts a session row with id = `sha256(token)`.
- `validateSession(db, token)` — looks up + checks expiry, deletes if expired.
- `invalidateSession(db, token)` — explicit logout.

The DB never stores the raw token, only its hash. A leak of the `sessions` table cannot impersonate users.

## Rotation / revocation

Not implemented yet:

- Signing key rotation (one key per user, never rotated).
- Session list/revoke ("sign out all devices").

For both, add a `revoke` endpoint that clears `sessions` for a userId and re-issues the signing key. Bump every connected mobile client by forcing a re-signin on next 401.
