import { Box, Card, Screen, Text } from "@retardmaxxing/ui-native";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "../../lib/trpc-client";

export default function Home() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: () => trpcClient.auth.health.query(),
  });
  return (
    <Screen>
      <Box gap="m">
        <Text variant="h1">retardmaxxing</Text>
        <Card>
          <Text variant="body">
            API: {health.isLoading ? "…" : health.data?.ok ? "ok" : "down"}
          </Text>
        </Card>
      </Box>
    </Screen>
  );
}
