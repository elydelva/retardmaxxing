import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { trpcClient } from "./trpc-client";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushRegistration {
  token: string;
  platform: "ios" | "android" | "web";
}

export async function registerForPushNotifications(): Promise<PushRegistration | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== "granted") {
    const { status: req } = await Notifications.requestPermissionsAsync();
    status = req;
  }
  if (status !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync();
  const platform: PushRegistration["platform"] =
    Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";

  await trpcClient.notifications.registerPushToken.mutate({
    token: tokenResponse.data,
    platform,
  });
  return { token: tokenResponse.data, platform };
}

export async function revokePushOnLogout(token: string | null): Promise<void> {
  if (!token) return;
  try {
    await trpcClient.notifications.revokePushToken.mutate({ token });
  } catch {
    // best-effort
  }
}

export function onNotificationResponse(
  handler: (kind: string, data: Record<string, unknown>) => void
): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = (response.notification.request.content.data ?? {}) as Record<string, unknown>;
    const kind = typeof data.kind === "string" ? data.kind : "unknown";
    handler(kind, data);
  });
  return () => sub.remove();
}
