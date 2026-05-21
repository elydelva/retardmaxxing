import type {
  Database,
  NewPayment,
  NewSubscription,
  Payment,
  Product,
  Subscription,
} from "@retardmaxxing/database";
import {
  payments,
  products,
  stripeWebhookEvents,
  subscriptions,
  users,
} from "@retardmaxxing/database";
import { and, desc, eq } from "drizzle-orm";

export interface BillingRepo {
  setStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void>;
  findStripeCustomerId(userId: string): Promise<string | null>;
  upsertProduct(p: Product): Promise<void>;
  findProductByStripePriceId(priceId: string): Promise<Product | null>;
  insertPayment(values: NewPayment): Promise<void>;
  findPaymentByIntent(intentId: string): Promise<Payment | null>;
  listPayments(userId: string): Promise<Payment[]>;
  upsertSubscription(values: NewSubscription): Promise<void>;
  findSubscriptionByStripeId(id: string): Promise<Subscription | null>;
  findActiveSubscription(userId: string): Promise<Subscription | null>;
  listSubscriptions(userId: string): Promise<Subscription[]>;
  hasWebhookEvent(stripeEventId: string): Promise<boolean>;
  insertWebhookEvent(stripeEventId: string, type: string, payload: unknown): Promise<void>;
}

export function createBillingRepo({ db }: { db: Database }): BillingRepo {
  return {
    async setStripeCustomerId(userId, stripeCustomerId) {
      await db
        .update(users)
        .set({ stripeCustomerId, updatedAt: new Date() })
        .where(eq(users.id, userId));
    },
    async findStripeCustomerId(userId) {
      const row = await db
        .select({ stripeCustomerId: users.stripeCustomerId })
        .from(users)
        .where(eq(users.id, userId))
        .get();
      return row?.stripeCustomerId ?? null;
    },
    async upsertProduct(p) {
      await db
        .insert(products)
        .values(p)
        .onConflictDoUpdate({
          target: products.stripeProductId,
          set: {
            stripePriceId: p.stripePriceId,
            name: p.name,
            description: p.description,
            amountCents: p.amountCents,
            currency: p.currency,
            active: p.active,
            metadata: p.metadata,
            updatedAt: new Date(),
          },
        });
    },
    async findProductByStripePriceId(priceId) {
      return (
        (await db.select().from(products).where(eq(products.stripePriceId, priceId)).get()) ?? null
      );
    },
    async insertPayment(values) {
      await db.insert(payments).values(values);
    },
    async findPaymentByIntent(intentId) {
      return (
        (await db
          .select()
          .from(payments)
          .where(eq(payments.stripePaymentIntentId, intentId))
          .get()) ?? null
      );
    },
    async listPayments(userId) {
      return db
        .select()
        .from(payments)
        .where(eq(payments.userId, userId))
        .orderBy(desc(payments.createdAt))
        .all();
    },
    async upsertSubscription(values) {
      await db
        .insert(subscriptions)
        .values(values)
        .onConflictDoUpdate({
          target: subscriptions.stripeSubscriptionId,
          set: {
            status: values.status,
            stripePriceId: values.stripePriceId,
            planId: values.planId,
            currentPeriodStart: values.currentPeriodStart,
            currentPeriodEnd: values.currentPeriodEnd,
            cancelAtPeriodEnd: values.cancelAtPeriodEnd,
            canceledAt: values.canceledAt,
            trialStart: values.trialStart,
            trialEnd: values.trialEnd,
            updatedAt: new Date(),
          },
        });
    },
    async findSubscriptionByStripeId(id) {
      return (
        (await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, id))
          .get()) ?? null
      );
    },
    async findActiveSubscription(userId) {
      return (
        (await db
          .select()
          .from(subscriptions)
          .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
          .get()) ?? null
      );
    },
    async listSubscriptions(userId) {
      return db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .orderBy(desc(subscriptions.createdAt))
        .all();
    },
    async hasWebhookEvent(stripeEventId) {
      const row = await db
        .select({ id: stripeWebhookEvents.stripeEventId })
        .from(stripeWebhookEvents)
        .where(eq(stripeWebhookEvents.stripeEventId, stripeEventId))
        .get();
      return row !== undefined;
    },
    async insertWebhookEvent(stripeEventId, type, payload) {
      await db.insert(stripeWebhookEvents).values({
        stripeEventId,
        type,
        payload,
        processedAt: new Date(),
      });
    },
  };
}
