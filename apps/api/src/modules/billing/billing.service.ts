import {
  checkoutSessionSchema,
  type StripeCheckoutSession,
  type StripeEvent,
  type StripeSubscription,
  stripeEventSchema,
  stripeGet,
  stripePost,
  stripeSubscriptionSchema,
} from "@retardmaxxing/billing";
import { TRPCError } from "@trpc/server";
import type { AppBindings } from "../../lib/bindings";
import type { Logger } from "../../lib/logger";
import type { UsersRepo } from "../users/users.repo";
import type { BillingRepo } from "./billing.repo";

export interface CreateOneTimeCheckoutInput {
  priceId: string;
  quantity?: number | undefined;
  successUrl?: string | undefined;
  cancelUrl?: string | undefined;
}

export interface CreateSubscriptionCheckoutInput {
  priceId: string;
  trialDays?: number | undefined;
  successUrl?: string | undefined;
  cancelUrl?: string | undefined;
}

export interface BillingService {
  createOneTimeCheckout(
    userId: string,
    input: CreateOneTimeCheckoutInput
  ): Promise<{ url: string }>;
  createSubscriptionCheckout(
    userId: string,
    input: CreateSubscriptionCheckoutInput
  ): Promise<{ url: string }>;
  createPortalSession(userId: string): Promise<{ url: string }>;
  cancelAtPeriodEnd(userId: string): Promise<void>;
  handleWebhookEvent(rawEvent: unknown): Promise<{ handled: boolean; type: string }>;
}

export interface BillingServiceDeps {
  env: AppBindings;
  logger: Logger;
  billingRepo: BillingRepo;
  usersRepo: UsersRepo;
}

export function createBillingService(deps: BillingServiceDeps): BillingService {
  const { env, logger, billingRepo, usersRepo } = deps;

  async function ensureStripeCustomer(userId: string): Promise<string> {
    const existing = await billingRepo.findStripeCustomerId(userId);
    if (existing) return existing;
    const user = await usersRepo.findById(userId);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

    const customer = await stripePost<{ id: string }>(
      "customers",
      {
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId: user.id },
      },
      env.STRIPE_SECRET_KEY,
      `customer-${user.id}`
    );
    await billingRepo.setStripeCustomerId(user.id, customer.id);
    return customer.id;
  }

  async function syncSubscriptionFromStripe(sub: StripeSubscription): Promise<void> {
    const userIdFromMetadata = sub.metadata?.["userId"];
    let userId = userIdFromMetadata;
    if (!userId) {
      // backfill via customer lookup
      const customer = await stripeGet<{ metadata?: Record<string, string> }>(
        `customers/${sub.customer}`,
        env.STRIPE_SECRET_KEY
      );
      userId = customer.metadata?.["userId"];
    }
    if (!userId) {
      logger.warn("billing.subscription.noUser", { subId: sub.id, customer: sub.customer });
      return;
    }
    const item = sub.items.data[0];
    if (!item) {
      logger.warn("billing.subscription.noItem", { subId: sub.id });
      return;
    }
    const product = await billingRepo.findProductByStripePriceId(item.price.id);
    const planId = product?.id ?? item.price.product;

    await billingRepo.upsertSubscription({
      id: `sub_${sub.id}`,
      userId,
      planId,
      stripeCustomerId: sub.customer,
      stripeSubscriptionId: sub.id,
      stripePriceId: item.price.id,
      status: sub.status as never,
      currentPeriodStart: sub.current_period_start
        ? new Date(sub.current_period_start * 1000)
        : null,
      currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
      trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : null,
      trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async function recordPaymentFromSession(session: StripeCheckoutSession): Promise<void> {
    if (!session.payment_intent) return;
    const userId = session.metadata?.["userId"] ?? session.client_reference_id;
    if (!userId) {
      logger.warn("billing.payment.noUser", { sessionId: session.id });
      return;
    }
    const existing = await billingRepo.findPaymentByIntent(session.payment_intent);
    if (existing) return;
    await billingRepo.insertPayment({
      id: `pay_${session.payment_intent}`,
      userId,
      productId: null,
      stripePaymentIntentId: session.payment_intent,
      stripeCheckoutSessionId: session.id,
      amountCents: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      status: "paid",
      paidAt: new Date(),
      failedAt: null,
      refundedAt: null,
      metadata: session.metadata ?? null,
      createdAt: new Date(),
    });
  }

  return {
    async createOneTimeCheckout(userId, input) {
      const customerId = await ensureStripeCustomer(userId);
      const session = await stripePost<{ id: string; url: string }>(
        "checkout/sessions",
        {
          mode: "payment",
          customer: customerId,
          client_reference_id: userId,
          line_items: [{ price: input.priceId, quantity: input.quantity ?? 1 }],
          success_url: input.successUrl ?? env.STRIPE_SUCCESS_URL,
          cancel_url: input.cancelUrl ?? env.STRIPE_CANCEL_URL,
          metadata: { userId, flow: "one-time" },
        },
        env.STRIPE_SECRET_KEY
      );
      return { url: session.url };
    },

    async createSubscriptionCheckout(userId, input) {
      const customerId = await ensureStripeCustomer(userId);
      const body: Record<string, unknown> = {
        mode: "subscription",
        customer: customerId,
        client_reference_id: userId,
        line_items: [{ price: input.priceId, quantity: 1 }],
        success_url: input.successUrl ?? env.STRIPE_SUCCESS_URL,
        cancel_url: input.cancelUrl ?? env.STRIPE_CANCEL_URL,
        metadata: { userId, flow: "subscription" },
        subscription_data: { metadata: { userId } },
      };
      if (input.trialDays && input.trialDays > 0) {
        (body["subscription_data"] as Record<string, unknown>)["trial_period_days"] =
          input.trialDays;
      }
      const session = await stripePost<{ id: string; url: string }>(
        "checkout/sessions",
        body as never,
        env.STRIPE_SECRET_KEY
      );
      return { url: session.url };
    },

    async createPortalSession(userId) {
      const customerId = await billingRepo.findStripeCustomerId(userId);
      if (!customerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No billing customer for user" });
      }
      const portal = await stripePost<{ id: string; url: string }>(
        "billing_portal/sessions",
        { customer: customerId, return_url: env.STRIPE_PORTAL_RETURN_URL },
        env.STRIPE_SECRET_KEY
      );
      return { url: portal.url };
    },

    async cancelAtPeriodEnd(userId) {
      const active = await billingRepo.findActiveSubscription(userId);
      if (!active) throw new TRPCError({ code: "NOT_FOUND", message: "No active subscription" });
      const updated = await stripePost<StripeSubscription>(
        `subscriptions/${active.stripeSubscriptionId}`,
        { cancel_at_period_end: true },
        env.STRIPE_SECRET_KEY
      );
      const parsed = stripeSubscriptionSchema.parse(updated);
      await syncSubscriptionFromStripe(parsed);
    },

    async handleWebhookEvent(rawEvent) {
      const event: StripeEvent = stripeEventSchema.parse(rawEvent);
      if (await billingRepo.hasWebhookEvent(event.id)) {
        return { handled: false, type: event.type };
      }
      await billingRepo.insertWebhookEvent(event.id, event.type, event);

      switch (event.type) {
        case "checkout.session.completed":
        case "checkout.session.async_payment_succeeded": {
          const session = checkoutSessionSchema.parse(event.data.object);
          if (session.customer && session.metadata?.["userId"]) {
            await billingRepo.setStripeCustomerId(session.metadata["userId"], session.customer);
          }
          if (session.mode === "payment") {
            await recordPaymentFromSession(session);
          } else if (session.mode === "subscription" && session.subscription) {
            const sub = stripeSubscriptionSchema.parse(
              await stripeGet<unknown>(
                `subscriptions/${session.subscription}`,
                env.STRIPE_SECRET_KEY
              )
            );
            await syncSubscriptionFromStripe(sub);
          }
          break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
        case "customer.subscription.trial_will_end": {
          const sub = stripeSubscriptionSchema.parse(event.data.object);
          await syncSubscriptionFromStripe(sub);
          break;
        }
        case "invoice.paid":
        case "invoice.payment_failed": {
          const inv = event.data.object as { subscription?: string };
          if (inv.subscription) {
            const sub = stripeSubscriptionSchema.parse(
              await stripeGet<unknown>(`subscriptions/${inv.subscription}`, env.STRIPE_SECRET_KEY)
            );
            await syncSubscriptionFromStripe(sub);
          }
          break;
        }
        case "product.updated":
        case "price.updated": {
          logger.info("billing.catalog.update", { type: event.type });
          break;
        }
        default:
          logger.info("billing.webhook.unhandled", { type: event.type });
      }
      return { handled: true, type: event.type };
    },
  };
}
