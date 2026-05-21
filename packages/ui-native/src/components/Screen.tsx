import type { ReactNode } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { useTheme } from "@shopify/restyle";
import type { Theme } from "../theme";
import { Box } from "./Box";

export interface ScreenProps {
  children: ReactNode;
  padding?: keyof Theme["spacing"];
}

export function Screen({ children, padding = "m" }: ScreenProps) {
  const theme = useTheme<Theme>();
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Box flex={1} padding={padding} backgroundColor="background">
        {children}
      </Box>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
