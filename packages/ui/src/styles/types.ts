import type { ColorVariantProps } from "./colors";
import type { ShapeVariantProps } from "./shapes";
import type { FontSizeVariantProps, FontVariantProps } from "./typography";

export interface StorefrontStyle {
  palette: ColorVariantProps["palette"];
  font: FontVariantProps["font"];
  size: FontSizeVariantProps["size"];
  shape: ShapeVariantProps["shape"];
}

export type { ColorVariantProps } from "./colors";
export type { ShapeVariantProps } from "./shapes";
export type { FontSizeVariantProps, FontVariantProps } from "./typography";
