import type { ReactNode } from "react";
import { Box, type BoxProps } from "./Box";

export function Card({ children, ...rest }: BoxProps & { children: ReactNode }) {
  return (
    <Box
      backgroundColor="surface"
      borderRadius="m"
      padding="m"
      borderColor="border"
      borderWidth={1}
      {...rest}
    >
      {children}
    </Box>
  );
}
