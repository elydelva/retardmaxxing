import type { UpdateNotificationPreferencesInput } from "@retardmaxxing/contract";
import type {
  Database,
  NewPushToken,
  NotificationPreferences,
  PushToken,
} from "@retardmaxxing/database";
import { notificationLog, notificationPreferences, pushTokens } from "@retardmaxxing/database";
import { and, eq, isNull } from "drizzle-orm";

export type NotificationPreferencesInput = UpdateNotificationPreferencesInput;

export interface NotificationsRepo {
  upsertPushToken(values: NewPushToken): Promise<void>;
  revokePushToken(token: string): Promise<void>;
  listActivePushTokens(userId: string): Promise<PushToken[]>;
  markTokensRevoked(tokens: string[]): Promise<void>;
  getPreferences(userId: string): Promise<NotificationPreferences | null>;
  upsertPreferences(userId: string, prefs: NotificationPreferencesInput): Promise<void>;
  logDelivery(values: {
    id: string;
    userId: string;
    kind: string;
    channel: "push" | "email" | "sms";
    status: string;
    error?: string | undefined;
  }): Promise<void>;
}

export function createNotificationsRepo({ db }: { db: Database }): NotificationsRepo {
  return {
    async upsertPushToken(values) {
      await db
        .insert(pushTokens)
        .values(values)
        .onConflictDoUpdate({
          target: pushTokens.expoPushToken,
          set: {
            userId: values.userId,
            platform: values.platform,
            deviceId: values.deviceId,
            lastSeenAt: new Date(),
            revokedAt: null,
          },
        });
    },
    async revokePushToken(token) {
      await db
        .update(pushTokens)
        .set({ revokedAt: new Date() })
        .where(eq(pushTokens.expoPushToken, token));
    },
    async listActivePushTokens(userId) {
      return db
        .select()
        .from(pushTokens)
        .where(and(eq(pushTokens.userId, userId), isNull(pushTokens.revokedAt)))
        .all();
    },
    async markTokensRevoked(tokens) {
      if (tokens.length === 0) return;
      for (const t of tokens) {
        await db
          .update(pushTokens)
          .set({ revokedAt: new Date() })
          .where(eq(pushTokens.expoPushToken, t));
      }
    },
    async getPreferences(userId) {
      return (
        (await db
          .select()
          .from(notificationPreferences)
          .where(eq(notificationPreferences.userId, userId))
          .get()) ?? null
      );
    },
    async upsertPreferences(userId, prefs) {
      const perKind = prefs.perKind as NotificationPreferences["perKind"];
      await db
        .insert(notificationPreferences)
        .values({
          userId,
          push: prefs.push ?? true,
          email: prefs.email ?? true,
          sms: prefs.sms ?? false,
          perKind: perKind ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: notificationPreferences.userId,
          set: {
            push: prefs.push,
            email: prefs.email,
            sms: prefs.sms,
            perKind,
            updatedAt: new Date(),
          },
        });
    },
    async logDelivery(values) {
      await db.insert(notificationLog).values({
        id: values.id,
        userId: values.userId,
        kind: values.kind,
        channel: values.channel,
        status: values.status,
        error: values.error ?? null,
        sentAt: new Date(),
      });
    },
  };
}
