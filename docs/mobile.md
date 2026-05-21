# Mobile — Expo + Restyle + native iOS

`apps/mobile` is Expo Router-based. Styling = **Shopify Restyle** (typed theme) instead of nativewind for a more iOS-native feel. SF Symbols via `expo-symbols`.

## Tech

- Expo Router (file-based routes in `app/`)
- React Navigation native stack (perf)
- Shopify Restyle (`packages/ui-native`)
- `expo-symbols` for SF Symbols
- `expo-notifications` (see [notifications.md](./notifications.md))
- `react-native-reanimated@4` + `react-native-gesture-handler`

## Route map

```
app/
  _layout.tsx              # Providers + root Stack
  index.tsx                # → redirect to /(tabs)/home
  (tabs)/
    _layout.tsx            # Tab navigator (home / billing / profile)
    home.tsx
    billing.tsx            # subscriptions list + customer portal entry
    profile.tsx
  auth/
    sign-in.tsx
    sign-up.tsx
  settings/
    index.tsx
    notifications.tsx
```

## UI primitives — `@retardmaxxing/ui-native`

- `Box` / `Text` — Restyle factory output, themed by tokens
- `Screen` — SafeArea + padded background
- `Button` — variants (primary/secondary/ghost/danger)
- `Card`, `ListItem`
- `Symbol` — SF Symbols on iOS, fallback elsewhere

Theme: `packages/ui-native/src/theme/index.ts`. Two themes (light/dark).

## Integrity / HMAC

`lib/integrity.ts` builds canonical `METHOD\nPATH\nTIMESTAMP_MS\nBODY` and signs with `signingKey` from SecureStore. Server middleware: `apps/api/src/middleware/integrity.ts`. Drift is caught by `apps/api/test/contracts/integrity-hmac.contract.test.ts`.

## Attestation

`lib/attestation.ts` — stub for App Attest (iOS) / Play Integrity (Android). Falls back to dev mode for simulators. Wire `@expo/app-integrity` in production.

## Logger

`lib/logger.ts` — allowlist-based PII redaction. Don't log raw bodies, tokens, or emails — pass through `log.info`/`warn`/`error` which strips them.

## E2E — Maestro

Flows in `apps/mobile/.maestro/flows/`. Run: `bun run mobile:e2e`. Add flows for major journeys; keep them resilient (text-based assertions, not coordinates).
