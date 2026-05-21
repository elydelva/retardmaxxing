import { z } from "zod";

export const CreateOneTimeCheckoutInput = z.object({
  priceId: z.string().min(1),
  quantity: z.number().int().positive().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});
export type CreateOneTimeCheckoutInput = z.infer<typeof CreateOneTimeCheckoutInput>;

export const CreateSubscriptionCheckoutInput = z.object({
  priceId: z.string().min(1),
  trialDays: z.number().int().nonnegative().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});
export type CreateSubscriptionCheckoutInput = z.infer<typeof CreateSubscriptionCheckoutInput>;

export const CheckoutResult = z.object({ url: z.string().url() });
export type CheckoutResult = z.infer<typeof CheckoutResult>;

export const SubscriptionDto = z.object({
  id: z.string(),
  status: z.string(),
  planId: z.string(),
  stripePriceId: z.string(),
  currentPeriodEnd: z.number().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  trialEnd: z.number().nullable(),
});
export type SubscriptionDto = z.infer<typeof SubscriptionDto>;

export const PaymentDto = z.object({
  id: z.string(),
  amountCents: z.number(),
  currency: z.string(),
  status: z.string(),
  paidAt: z.number().nullable(),
});
export type PaymentDto = z.infer<typeof PaymentDto>;
