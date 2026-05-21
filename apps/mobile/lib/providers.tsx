import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@shopify/restyle";
import { theme } from "@retardmaxxing/ui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useState, type ReactNode } from "react";
import { StyleSheet } from "react-native";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <GestureHandlerRootView style={styles.flex}>
      <QueryClientProvider client={client}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
