import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const PROVIDERS = ["google", "apple"] as const;
export type Provider = (typeof PROVIDERS)[number];

export const PLAN_TIERS = ["free", "pro", "enterprise"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const PAYMENT_STATUS = ["pending", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export const SUBSCRIPTION_STATUS = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "unpaid",
  "paused",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[number];

export const PUSH_PLATFORMS = ["ios", "android", "web"] as const;
export type PushPlatform = (typeof PUSH_PLATFORMS)[number];

export const NOTIFICATION_CHANNELS = ["push", "email", "sms"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

// ─── Users + auth ─────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerifiedAt: integer("email_verified_at", { mode: "timestamp" }),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  passwordHash: text("password_hash"),
  signingKey: text("signing_key").notNull(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  phoneNumber: text("phone_number"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const identities = sqliteTable("identities", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider", { enum: PROVIDERS }).notNull(),
  providerUserId: text("provider_user_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── Billing: subscription tiers ──────────────────────────────────────────────

export const plans = sqliteTable("plans", {
  id: text("id").primaryKey(),
  tier: text("tier", { enum: PLAN_TIERS }).notNull(),
  name: text("name").notNull(),
  priceMonthlyCents: integer("price_monthly_cents").notNull().default(0),
  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),
  features: text("features", { mode: "json" }).$type<string[]>(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
    stripePriceId: text("stripe_price_id").notNull(),
    status: text("status", { enum: SUBSCRIPTION_STATUS }).notNull(),
    currentPeriodStart: integer("current_period_start", { mode: "timestamp" }),
    currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
    cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" })
      .notNull()
      .default(false),
    canceledAt: integer("canceled_at", { mode: "timestamp" }),
    trialStart: integer("trial_start", { mode: "timestamp" }),
    trialEnd: integer("trial_end", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("subscriptions_user_status_idx").on(t.userId, t.status)]
);

// ─── Billing: one-time products (no subscription link) ────────────────────────

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  stripeProductId: text("stripe_product_id").notNull().unique(),
  stripePriceId: text("stripe_price_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("usd"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, string>>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const payments = sqliteTable(
  "payments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id),
    stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    status: text("status", { enum: PAYMENT_STATUS }).notNull(),
    paidAt: integer("paid_at", { mode: "timestamp" }),
    failedAt: integer("failed_at", { mode: "timestamp" }),
    refundedAt: integer("refunded_at", { mode: "timestamp" }),
    metadata: text("metadata", { mode: "json" }).$type<Record<string, string>>(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("payments_user_paid_at_idx").on(t.userId, t.paidAt)]
);

export const stripeWebhookEvents = sqliteTable("stripe_webhook_events", {
  stripeEventId: text("stripe_event_id").primaryKey(),
  type: text("type").notNull(),
  payload: text("payload", { mode: "json" }).notNull(),
  processedAt: integer("processed_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── Notifications: push tokens + preferences ─────────────────────────────────

export const pushTokens = sqliteTable(
  "push_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expoPushToken: text("expo_push_token").notNull(),
    platform: text("platform", { enum: PUSH_PLATFORMS }).notNull(),
    deviceId: text("device_id"),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    revokedAt: integer("revoked_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("push_tokens_token_unique").on(t.expoPushToken),
    index("push_tokens_user_idx").on(t.userId, t.revokedAt),
  ]
);

export const notificationPreferences = sqliteTable("notification_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  push: integer("push", { mode: "boolean" }).notNull().default(true),
  email: integer("email", { mode: "boolean" }).notNull().default(true),
  sms: integer("sms", { mode: "boolean" }).notNull().default(false),
  perKind: text("per_kind", { mode: "json" }).$type<
    Record<
      string,
      {
        push?: boolean;
        email?: boolean;
        sms?: boolean;
      }
    >
  >(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const notificationLog = sqliteTable(
  "notification_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    channel: text("channel", { enum: NOTIFICATION_CHANNELS }).notNull(),
    status: text("status").notNull(),
    error: text("error"),
    sentAt: integer("sent_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("notification_log_user_kind_idx").on(t.userId, t.kind, t.sentAt)]
);
