import type { ReactNode } from "react";
import { Pressable } from "react-native";
import { Box } from "./Box";
import { Text } from "./Text";

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
}

export function ListItem({ title, subtitle, leading, trailing, onPress }: ListItemProps) {
  return (
    <Pressable onPress={onPress}>
      <Box
        flexDirection="row"
        alignItems="center"
        gap="m"
        paddingVertical="s"
        paddingHorizontal="m"
        backgroundColor="surface"
      >
        {leading}
        <Box flex={1}>
          <Text variant="body">{title}</Text>
          {subtitle ? <Text variant="muted">{subtitle}</Text> : null}
        </Box>
        {trailing}
      </Box>
    </Pressable>
  );
}
