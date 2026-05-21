import { cva, type VariantProps } from "class-variance-authority";

export const fontVariants = cva("", {
  variants: {
    font: {
      sans: "font-sans",
      serif: "font-serif",
      mono: "font-mono",
      display: "font-serif italic", // Modern look for "display" if font-display isn't defined
    },
  },
  defaultVariants: {
    font: "sans",
  },
});

export const fontSizeVariants = cva("", {
  variants: {
    size: {
      s: "text-sm",
      m: "text-base",
      l: "text-lg",
      xl: "text-xl",
    },
  },
  defaultVariants: {
    size: "m",
  },
});

export type FontVariantProps = VariantProps<typeof fontVariants>;
export type FontSizeVariantProps = VariantProps<typeof fontSizeVariants>;

export const FONT_OPTIONS = [
  { id: "sans", name: "Sans Serif", preview: "Aa" },
  { id: "serif", name: "Serif", preview: "Aa" },
  { id: "mono", name: "Monospace", preview: "Aa" },
  { id: "display", name: "Display", preview: "Aa" },
] as const;

export const FONT_SIZE_OPTIONS = [
  { id: "s", name: "S" },
  { id: "m", name: "M" },
  { id: "l", name: "L" },
  { id: "xl", name: "XL" },
] as const;
