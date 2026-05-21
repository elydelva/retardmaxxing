import { createRestyleComponent, type VariantProps, createVariant } from "@shopify/restyle";
import type { ReactNode } from "react";
import { Pressable as RNPressable, type PressableProps as RNPressableProps } from "react-native";
import type { Theme } from "../theme";
import { Box } from "./Box";
import { Text } from "./Text";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends Omit<RNPressableProps, "children"> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  leading?: ReactNode;
}

const bgByVariant: Record<ButtonVariant, keyof Theme["colors"]> = {
  primary: "accent",
  secondary: "accentMuted",
  ghost: "background",
  danger: "danger",
};
const fgByVariant: Record<ButtonVariant, keyof Theme["colors"]> = {
  primary: "textInverse",
  secondary: "accent",
  ghost: "text",
  danger: "textInverse",
};

export function Button({ label, variant = "primary", leading, disabled, ...rest }: ButtonProps) {
  return (
    <RNPressable disabled={disabled} {...rest}>
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="center"
        gap="s"
        paddingVertical="s"
        paddingHorizontal="m"
        borderRadius="m"
        backgroundColor={bgByVariant[variant]}
        opacity={disabled ? 0.5 : 1}
      >
        {leading}
        <Text variant="button" color={fgByVariant[variant]}>
          {label}
        </Text>
      </Box>
    </RNPressable>
  );
}
