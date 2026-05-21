import { createTheme } from "@shopify/restyle";

const palette = {
  white: "#FFFFFF",
  black: "#000000",
  ink900: "#0B0B0F",
  ink700: "#2A2A33",
  ink500: "#5A5A66",
  ink300: "#A0A0AD",
  ink100: "#E6E6EC",
  bg: "#F7F7F9",
  card: "#FFFFFF",
  accent: "#5B5BD6",
  accentMuted: "#E7E7FB",
  danger: "#E5484D",
  success: "#30A46C",
  warning: "#F5A524",
};

export const theme = createTheme({
  colors: {
    background: palette.bg,
    surface: palette.card,
    text: palette.ink900,
    textMuted: palette.ink500,
    textInverse: palette.white,
    border: palette.ink100,
    accent: palette.accent,
    accentMuted: palette.accentMuted,
    danger: palette.danger,
    success: palette.success,
    warning: palette.warning,
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 40,
    xxl: 64,
  },
  borderRadii: {
    none: 0,
    s: 6,
    m: 12,
    l: 20,
    pill: 999,
  },
  textVariants: {
    defaults: {
      fontSize: 16,
      color: "text",
    },
    h1: {
      fontSize: 32,
      fontWeight: "700",
      color: "text",
    },
    h2: {
      fontSize: 24,
      fontWeight: "600",
      color: "text",
    },
    body: {
      fontSize: 16,
      color: "text",
    },
    muted: {
      fontSize: 14,
      color: "textMuted",
    },
    button: {
      fontSize: 16,
      fontWeight: "600",
      color: "textInverse",
    },
  },
  breakpoints: {
    phone: 0,
    tablet: 768,
  },
});

const darkOverrides = {
  background: palette.ink900,
  surface: palette.ink700,
  text: palette.white,
  textMuted: palette.ink300,
  textInverse: palette.ink900,
  border: palette.ink700,
  accentMuted: "#2A2A4A",
};

export const darkTheme: Theme = {
  ...theme,
  colors: { ...theme.colors, ...darkOverrides },
};

export type Theme = typeof theme;
