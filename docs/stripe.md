# Stripe — payments + subscriptions

Boilerplate uses a **custom HTTP wrapper** (`packages/billing`) instead of the Stripe SDK — lighter, Workers-native, and avoids Node polyfills.

## Two flows, cleanly separated

- **One-time** (`billingService.createOneTimeCheckout`): pure product purchase → row in `payments`. **No subscription, no plan grant.**
- **Subscription** (`billingService.createSubscriptionCheckout`): recurring billing → row in `subscriptions`. Customer portal handles upgrade/downgrade/cancel.

## Where things live

| Concern | File |
|---|---|
| HTTP client + signature verify | `packages/billing/src/client.ts` |
| Event schemas | `packages/billing/src/types.ts` |
| Service (checkout, portal, sync) | `apps/api/src/modules/billing/billing.service.ts` |
| Repo | `apps/api/src/modules/billing/billing.repo.ts` |
| tRPC router | `apps/api/src/modules/billing/billing.router.ts` |
| Webhook handler | `apps/api/src/routes/webhooks/stripe.ts` |
| Schema | `packages/database/src/schema.ts` (payments, subscriptions, products, stripe_webhook_events) |

## Webhook events handled

- `checkout.session.completed` / `async_payment_succeeded` — branches by `mode`. `payment` → insert payment row. `subscription` → fetch + upsert subscription.
- `customer.subscription.created` / `updated` / `deleted` / `trial_will_end` — upsert subscription state.
- `invoice.paid` / `payment_failed` — re-fetch and sync subscription (dunning state).
- `product.updated` / `price.updated` — catalogue refresh (extend as needed).

## Idempotency

Every webhook event is logged in `stripe_webhook_events` keyed by `stripe_event_id`. Re-deliveries are no-ops. Idempotency keys are also sent on customer creation (`Idempotency-Key: customer-<userId>`).

## Signature verification

`verifyStripeSignature` (in `packages/billing/src/client.ts`) does HMAC-SHA256, 300s tolerance, timing-safe compare. Rejects malformed headers and stale timestamps.

## Local development

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. `stripe login`
3. In one terminal: `bun dev` (starts wrangler on :8787)
4. In another: `bun run stripe:listen` → forwards to `http://localhost:8787/webhooks/stripe` and prints a `whsec_…` for `STRIPE_WEBHOOK_SECRET`.
5. Trigger events: `bun run stripe:trigger checkout.session.completed`

Required env (`apps/api/wrangler.toml` `[vars]` or `.dev.vars`):

```
STRIPE_SECRET_KEY=sk_test_…
STRIPE_WEBHOOK_SECRET=whsec_…
STRIPE_SUCCESS_URL=http://localhost:5173/billing/success
STRIPE_CANCEL_URL=http://localhost:5173/billing/cancel
STRIPE_PORTAL_RETURN_URL=http://localhost:5173/settings/billing
```

## Customer portal

`billing.portalSession` tRPC mutation returns a one-shot Stripe-hosted URL. Hand off all subscription mutations (upgrade, downgrade, cancel, payment method update) to the portal — no need to reimplement.

## Best practices baked in

- **Out-of-order events**: never trust webhook payload as latest state. For subscription events, re-fetch via `GET /subscriptions/:id` before upsert (already done).
- **Customer dedup**: `users.stripeCustomerId` is unique and backfilled on first checkout.
- **No silent failures**: webhook handler returns 500 on internal errors so Stripe retries.
- **Logs are PII-redacted** — see `apps/api/src/lib/logger.ts`.
