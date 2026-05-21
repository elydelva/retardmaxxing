import {
  RegisterPushTokenInput,
  RevokePushTokenInput,
  UpdateNotificationPreferencesInput,
} from "@retardmaxxing/contract";
import { protectedProcedure, router } from "../../trpc/context";

export const notificationsRouter = router({
  registerPushToken: protectedProcedure
    .input(RegisterPushTokenInput)
    .mutation(async ({ ctx, input }) => {
      await ctx.cradle.notificationsRepo.upsertPushToken({
        id: `pt_${crypto.randomUUID()}`,
        userId: ctx.cradle.userId as string,
        expoPushToken: input.token,
        platform: input.platform,
        deviceId: input.deviceId ?? null,
        lastSeenAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
      });
      return { ok: true };
    }),

  revokePushToken: protectedProcedure
    .input(RevokePushTokenInput)
    .mutation(async ({ ctx, input }) => {
      await ctx.cradle.notificationsRepo.revokePushToken(input.token);
      return { ok: true };
    }),

  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await ctx.cradle.notificationsRepo.getPreferences(ctx.cradle.userId as string);
    return (
      prefs ?? {
        push: true,
        email: true,
        sms: false,
        perKind: null,
      }
    );
  }),

  updatePreferences: protectedProcedure
    .input(UpdateNotificationPreferencesInput)
    .mutation(async ({ ctx, input }) => {
      await ctx.cradle.notificationsRepo.upsertPreferences(ctx.cradle.userId as string, input);
      return { ok: true };
    }),
});
