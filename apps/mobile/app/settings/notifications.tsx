import { Box, Card, ListItem, Screen, Text } from "@retardmaxxing/ui-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Switch } from "react-native";
import { trpcClient } from "../../lib/trpc-client";

export default function NotificationsPrefs() {
  const qc = useQueryClient();
  const prefs = useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: () => trpcClient.notifications.getPreferences.query(),
  });
  const update = useMutation({
    mutationFn: (input: { push?: boolean; email?: boolean; sms?: boolean }) =>
      trpcClient.notifications.updatePreferences.mutate(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", "preferences"] }),
  });

  return (
    <Screen>
      <Box gap="m">
        <Text variant="h2">Notifications</Text>
        {prefs.data ? (
          <Card padding="xs">
            <ListItem
              title="Push"
              trailing={
                <Switch value={prefs.data.push} onValueChange={(v) => update.mutate({ push: v })} />
              }
            />
            <ListItem
              title="Email"
              trailing={
                <Switch
                  value={prefs.data.email}
                  onValueChange={(v) => update.mutate({ email: v })}
                />
              }
            />
            <ListItem
              title="SMS"
              trailing={
                <Switch value={prefs.data.sms} onValueChange={(v) => update.mutate({ sms: v })} />
              }
            />
          </Card>
        ) : (
          <Text variant="muted">Loading…</Text>
        )}
      </Box>
    </Screen>
  );
}
