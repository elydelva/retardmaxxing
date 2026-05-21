import {
  type NotificationKind,
  type NotificationPayload,
  renderTemplate,
  sendExpoPush,
  sendResendEmail,
} from "@retardmaxxing/notifications";
import type { AppBindings } from "../../lib/bindings";
import type { Logger } from "../../lib/logger";
import type { UsersRepo } from "../users/users.repo";
import type { NotificationsRepo } from "./notifications.repo";

export interface DispatchOptions {
  channels?: Array<"push" | "email" | "sms">;
}

export interface NotificationsService {
  dispatch<K extends NotificationKind>(
    userId: string,
    kind: K,
    payload: NotificationPayload[K],
    options?: DispatchOptions
  ): Promise<void>;
}

export interface NotificationsServiceDeps {
  env: AppBindings;
  logger: Logger;
  notificationsRepo: NotificationsRepo;
  usersRepo: UsersRepo;
}

export function createNotificationsService(deps: NotificationsServiceDeps): NotificationsService {
  const { env, logger, notificationsRepo, usersRepo } = deps;

  function channelEnabled(
    prefs: Awaited<ReturnType<NotificationsRepo["getPreferences"]>>,
    kind: string,
    channel: "push" | "email" | "sms"
  ): boolean {
    const fallback = channel !== "sms";
    if (!prefs) return fallback;
    const perKind = prefs.perKind?.[kind]?.[channel];
    if (perKind !== undefined) return perKind;
    return prefs[channel];
  }

  return {
    async dispatch(userId, kind, payload, options) {
      const channels = options?.channels ?? ["push", "email", "sms"];
      const [prefs, user] = await Promise.all([
        notificationsRepo.getPreferences(userId),
        usersRepo.findById(userId),
      ]);
      if (!user) return;

      const rendered = renderTemplate(kind, payload);

      if (channels.includes("push") && rendered.push && channelEnabled(prefs, kind, "push")) {
        const tokens = await notificationsRepo.listActivePushTokens(userId);
        if (tokens.length > 0) {
          const messages = tokens.map((t) => ({
            to: t.expoPushToken,
            title: rendered.push?.title ?? "",
            body: rendered.push?.body ?? "",
            data: rendered.push?.data,
            sound: "default" as const,
          }));
          const result = await sendExpoPush(messages, env.EXPO_ACCESS_TOKEN);
          if (result.invalidTokens.length > 0) {
            await notificationsRepo.markTokensRevoked(result.invalidTokens);
          }
          await notificationsRepo.logDelivery({
            id: `nl_${crypto.randomUUID()}`,
            userId,
            kind,
            channel: "push",
            status: result.ok ? "sent" : "failed",
          });
        }
      }

      if (
        channels.includes("email") &&
        rendered.email &&
        channelEnabled(prefs, kind, "email") &&
        env.RESEND_API_KEY &&
        env.EMAIL_FROM
      ) {
        const result = await sendResendEmail(
          {
            to: user.email,
            from: env.EMAIL_FROM,
            subject: rendered.email.subject,
            html: rendered.email.html,
            text: rendered.email.text,
          },
          env.RESEND_API_KEY
        );
        await notificationsRepo.logDelivery({
          id: `nl_${crypto.randomUUID()}`,
          userId,
          kind,
          channel: "email",
          status: result.ok ? "sent" : "failed",
          error: result.error,
        });
      }

      if (
        channels.includes("sms") &&
        rendered.sms &&
        channelEnabled(prefs, kind, "sms") &&
        env.TWILIO_ACCOUNT_SID &&
        env.TWILIO_AUTH_TOKEN &&
        env.TWILIO_FROM
      ) {
        // Requires user phone — extend users schema later. Skip for now.
        logger.info("notifications.sms.skipped_no_phone", { userId, kind });
      }
    },
  };
}
