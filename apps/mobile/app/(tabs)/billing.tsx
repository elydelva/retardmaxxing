import { Box, Button, Card, ListItem, Screen, Text } from "@retardmaxxing/ui-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { trpcClient } from "../../lib/trpc-client";

export default function Billing() {
  const subs = useQuery({
    queryKey: ["billing", "subscriptions"],
    queryFn: () => trpcClient.billing.listSubscriptions.query(),
  });

  const portal = useMutation({
    mutationFn: () => trpcClient.billing.portalSession.mutate(),
    onSuccess: ({ url }) => {
      Linking.openURL(url);
    },
  });

  return (
    <Screen>
      <Box gap="m">
        <Text variant="h2">Subscriptions</Text>
        {subs.data?.length === 0 ? (
          <Text variant="muted">No active subscription.</Text>
        ) : (
          subs.data?.map((s) => (
            <Card key={s.id}>
              <ListItem
                title={s.stripePriceId}
                subtitle={`${s.status} • renews ${s.currentPeriodEnd?.toString() ?? "—"}`}
              />
            </Card>
          ))
        )}
        <Button
          label={portal.isPending ? "Opening…" : "Manage billing"}
          onPress={() => portal.mutate()}
          disabled={portal.isPending}
        />
      </Box>
    </Screen>
  );
}
