import { cva, type VariantProps } from "class-variance-authority";

export const shapeVariants = cva("", {
  variants: {
    shape: {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      full: "rounded-full",
    },
  },
  defaultVariants: {
    shape: "md",
  },
});

export type ShapeVariantProps = VariantProps<typeof shapeVariants>;

export const SHAPE_OPTIONS = [
  { id: "none", name: "Aucun" },
  { id: "sm", name: "Doux" },
  { id: "md", name: "Arrondi" },
  { id: "lg", name: "Prononcé" },
  { id: "xl", name: "Extra" },
  { id: "2xl", name: "Max" },
  { id: "full", name: "Cercle" },
] as const;
