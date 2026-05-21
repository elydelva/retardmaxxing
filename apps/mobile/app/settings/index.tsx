import { Box, Button, Screen, Text } from "@retardmaxxing/ui-native";
import { Link } from "expo-router";
import { revokePushOnLogout } from "../../lib/push";
import { clearSession } from "../../lib/secure-store";

export default function SettingsIndex() {
  return (
    <Screen>
      <Box gap="m">
        <Text variant="h2">Settings</Text>
        <Link href="/settings/notifications" asChild>
          <Button label="Notifications" variant="secondary" />
        </Link>
        <Button
          label="Sign out"
          variant="danger"
          onPress={async () => {
            await revokePushOnLogout(null);
            await clearSession();
          }}
        />
      </Box>
    </Screen>
  );
}
