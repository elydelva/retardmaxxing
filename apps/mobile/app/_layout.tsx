import { Stack } from "expo-router";
import { Providers } from "../lib/providers";

export default function RootLayout() {
  return (
    <Providers>
      <Stack screenOptions={{ headerLargeTitle: true }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/sign-in" options={{ title: "Sign in", presentation: "modal" }} />
        <Stack.Screen name="auth/sign-up" options={{ title: "Sign up", presentation: "modal" }} />
        <Stack.Screen name="settings/index" options={{ title: "Settings" }} />
        <Stack.Screen name="settings/notifications" options={{ title: "Notifications" }} />
      </Stack>
    </Providers>
  );
}
