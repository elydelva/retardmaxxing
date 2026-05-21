import { z } from "zod";

export const PushPlatform = z.enum(["ios", "android", "web"]);
export type PushPlatform = z.infer<typeof PushPlatform>;

export const RegisterPushTokenInput = z.object({
  token: z.string().min(1),
  platform: PushPlatform,
  deviceId: z.string().optional(),
});
export type RegisterPushTokenInput = z.infer<typeof RegisterPushTokenInput>;

export const RevokePushTokenInput = z.object({ token: z.string().min(1) });
export type RevokePushTokenInput = z.infer<typeof RevokePushTokenInput>;

export const NotificationPreferencesDto = z.object({
  push: z.boolean(),
  email: z.boolean(),
  sms: z.boolean(),
  perKind: z
    .record(
      z.object({
        push: z.boolean().optional(),
        email: z.boolean().optional(),
        sms: z.boolean().optional(),
      })
    )
    .nullable(),
});
export type NotificationPreferencesDto = z.infer<typeof NotificationPreferencesDto>;

export const UpdateNotificationPreferencesInput = NotificationPreferencesDto.partial();
export type UpdateNotificationPreferencesInput = z.infer<typeof UpdateNotificationPreferencesInput>;
