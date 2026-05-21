import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppBindings } from "../../../src/lib/bindings";
import type { BillingRepo } from "../../../src/modules/billing/billing.repo";
import {
  type BillingServiceDeps,
  createBillingService,
} from "../../../src/modules/billing/billing.service";
import { createFakeUsersRepo, makeUser, silentLogger } from "../../helpers/fakes";

const STRIPE_SECRET = "sk_test";

const env = {
  STRIPE_SECRET_KEY: STRIPE_SECRET,
  STRIPE_WEBHOOK_SECRET: "whsec_x",
  STRIPE_SUCCESS_URL: "https://app.test/success",
  STRIPE_CANCEL_URL: "https://app.test/cancel",
  STRIPE_PORTAL_RETURN_URL: "https://app.test/account",
} as unknown as AppBindings;

function createFakeBillingRepo(over: Partial<BillingRepo> = {}): BillingRepo {
  const customers = new Map<string, string>();
  const webhookEvents = new Set<string>();
  const payments = new Map<string, unknown>();
  const subs: unknown[] = [];
  return {
    async setStripeCustomerId(userId, id) {
      customers.set(userId, id);
    },
    async findStripeCustomerId(userId) {
      return customers.get(userId) ?? null;
    },
    async upsertProduct() {},
    async findProductByStripePriceId() {
      return null;
    },
    async insertPayment(v) {
      payments.set(v.stripePaymentIntentId ?? v.id, v);
    },
    async findPaymentByIntent(id) {
      return (payments.get(id) as never) ?? null;
    },
    async listPayments() {
      return [];
    },
    async upsertSubscription(v) {
      subs.push(v);
    },
    async findSubscriptionByStripeId() {
      return null;
    },
    async findActiveSubscription() {
      return null;
    },
    async listSubscriptions() {
      return [];
    },
    async hasWebhookEvent(id) {
      return webhookEvents.has(id);
    },
    async insertWebhookEvent(id) {
      webhookEvents.add(id);
    },
    ...over,
  };
}

function build(over: Partial<BillingServiceDeps> = {}) {
  const usersRepo = createFakeUsersRepo();
  void usersRepo.insertUser(makeUser());
  return createBillingService({
    env,
    logger: silentLogger,
    billingRepo: createFakeBillingRepo(),
    usersRepo,
    ...over,
  });
}

describe("billingService.createOneTimeCheckout", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/customers")) {
          return new Response(JSON.stringify({ id: "cus_123" }), { status: 200 });
        }
        if (url.endsWith("/checkout/sessions")) {
          return new Response(
            JSON.stringify({ id: "cs_123", url: "https://checkout.stripe.com/c/cs_123" }),
            { status: 200 }
          );
        }
        return new Response("not stubbed", { status: 500 });
      })
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a payment-mode checkout session and returns its url", async () => {
    const svc = build();
    const result = await svc.createOneTimeCheckout("u_test", { priceId: "price_abc" });
    expect(result.url).toContain("checkout.stripe.com");
  });
});

describe("billingService.handleWebhookEvent", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 200 }))
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("is idempotent — second delivery is a no-op", async () => {
    const repo = createFakeBillingRepo();
    const svc = createBillingService({
      env,
      logger: silentLogger,
      billingRepo: repo,
      usersRepo: createFakeUsersRepo(),
    });
    const event = {
      id: "evt_1",
      type: "ping",
      created: Math.floor(Date.now() / 1000),
      data: { object: {} },
    };
    const r1 = await svc.handleWebhookEvent(event);
    const r2 = await svc.handleWebhookEvent(event);
    expect(r1.handled).toBe(true);
    expect(r2.handled).toBe(false);
  });
});
