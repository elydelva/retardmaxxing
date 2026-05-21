import { z } from "zod";

export const stripeEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  created: z.number(),
  livemode: z.boolean().optional(),
  data: z.object({
    object: z.record(z.unknown()),
  }),
});

export type StripeEvent = z.infer<typeof stripeEventSchema>;

export const checkoutSessionSchema = z.object({
  id: z.string(),
  mode: z.enum(["payment", "subscription", "setup"]),
  customer: z.string().nullable().optional(),
  customer_email: z.string().nullable().optional(),
  client_reference_id: z.string().nullable().optional(),
  payment_intent: z.string().nullable().optional(),
  subscription: z.string().nullable().optional(),
  amount_total: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  payment_status: z.string().nullable().optional(),
  metadata: z.record(z.string()).nullable().optional(),
});
export type StripeCheckoutSession = z.infer<typeof checkoutSessionSchema>;

export const subscriptionItemSchema = z.object({
  id: z.string(),
  price: z.object({ id: z.string(), product: z.string() }),
});

export const stripeSubscriptionSchema = z.object({
  id: z.string(),
  customer: z.string(),
  status: z.string(),
  current_period_start: z.number().optional(),
  current_period_end: z.number().optional(),
  cancel_at_period_end: z.boolean().optional(),
  canceled_at: z.number().nullable().optional(),
  trial_start: z.number().nullable().optional(),
  trial_end: z.number().nullable().optional(),
  items: z.object({ data: z.array(subscriptionItemSchema) }),
  metadata: z.record(z.string()).nullable().optional(),
});
export type StripeSubscription = z.infer<typeof stripeSubscriptionSchema>;

export const stripeInvoiceSchema = z.object({
  id: z.string(),
  customer: z.string().nullable().optional(),
  subscription: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  amount_paid: z.number().optional(),
  amount_due: z.number().optional(),
  currency: z.string().optional(),
});
export type StripeInvoice = z.infer<typeof stripeInvoiceSchema>;
