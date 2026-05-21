import { Link } from "expo-router";
import { Box, Button, Screen, Text } from "@retardmaxxing/ui-native";

export default function Profile() {
  return (
    <Screen>
      <Box gap="m">
        <Text variant="h2">Profile</Text>
        <Link href="/settings" asChild>
          <Button label="Settings" variant="secondary" />
        </Link>
        <Link href="/settings/notifications" asChild>
          <Button label="Notifications" variant="secondary" />
        </Link>
      </Box>
    </Screen>
  );
}
