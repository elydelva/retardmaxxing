import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { TextInput } from "react-native";
import { Box, Button, Screen, Text } from "@retardmaxxing/ui-native";
import { saveSession } from "../../lib/secure-store";
import { trpcClient } from "../../lib/trpc-client";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const signIn = useMutation({
    mutationFn: () => trpcClient.auth.signIn.mutate({ email, password }),
    onSuccess: async (session) => {
      await saveSession({
        userId: session.userId,
        sessionToken: session.token,
        signingKey: session.signingKey,
      });
      router.replace("/(tabs)/home");
    },
  });

  return (
    <Screen>
      <Box gap="m">
        <Text variant="h2">Sign in</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
        />
        <Button
          label={signIn.isPending ? "…" : "Sign in"}
          onPress={() => signIn.mutate()}
          disabled={signIn.isPending}
        />
        {signIn.error ? <Text color="danger">{signIn.error.message}</Text> : null}
      </Box>
    </Screen>
  );
}
