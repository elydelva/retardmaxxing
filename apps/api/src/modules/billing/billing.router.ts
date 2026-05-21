import {
  CreateOneTimeCheckoutInput,
  CreateSubscriptionCheckoutInput,
} from "@retardmaxxing/contract";
import { protectedProcedure, router } from "../../trpc/context";

export const billingRouter = router({
  checkoutProduct: protectedProcedure
    .input(CreateOneTimeCheckoutInput)
    .mutation(({ ctx, input }) =>
      ctx.cradle.billingService.createOneTimeCheckout(ctx.cradle.userId as string, input)
    ),

  checkoutSubscription: protectedProcedure
    .input(CreateSubscriptionCheckoutInput)
    .mutation(({ ctx, input }) =>
      ctx.cradle.billingService.createSubscriptionCheckout(ctx.cradle.userId as string, input)
    ),

  portalSession: protectedProcedure.mutation(({ ctx }) =>
    ctx.cradle.billingService.createPortalSession(ctx.cradle.userId as string)
  ),

  cancelSubscription: protectedProcedure.mutation(({ ctx }) =>
    ctx.cradle.billingService.cancelAtPeriodEnd(ctx.cradle.userId as string)
  ),

  listSubscriptions: protectedProcedure.query(({ ctx }) =>
    ctx.cradle.billingRepo.listSubscriptions(ctx.cradle.userId as string)
  ),

  listPayments: protectedProcedure.query(({ ctx }) =>
    ctx.cradle.billingRepo.listPayments(ctx.cradle.userId as string)
  ),
});
