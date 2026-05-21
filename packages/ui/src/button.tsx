import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "./utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center cursor-pointer whitespace-nowrap rounded-[22px] text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 outline-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 select-none",
	{
		variants: {
			variant: {
				// Primary: Stone-800 background (Swaya dark but not pure black)
				default:
					"bg-stone-800 text-white hover:bg-stone-700 active:bg-stone-900",
				// Secondary: Stone-100 background
				secondary:
					"bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-200",
				// Tertiary: Stone-50 background
				tertiary:
					"bg-white text-stone-700 hover:bg-stone-100 active:bg-stone-100",
				// Outline: White background with subtle border
				outline:
					"bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 hover:border-stone-300",
				// Ghost: Transparent with hover
				ghost: "text-stone-600 hover:bg-stone-100 hover:text-stone-800",
				// Destructive
				destructive: "bg-red-50 text-red-600 hover:bg-red-100",
				// Link
				link: "text-stone-700 underline-offset-4 hover:underline",
				// Swaya pastel variants
				peach: "bg-[#FFF0E3] text-stone-700 hover:bg-[#FFE4CC]",
				mint: "bg-[#E8F4F0] text-stone-700 hover:bg-[#D8EBE5]",
				sky: "bg-[#E0F2FE] text-stone-700 hover:bg-[#CCE8FC]",
			},
			size: {
				default: "h-10 px-4 py-2.5 gap-2 rounded-2xl",
				xs: "h-7 px-2.5 py-1.5 text-xs gap-1.5 rounded-xl [&_svg:not([class*='size-'])]:size-3",
				sm: "h-9 px-3.5 py-2 gap-1.5 rounded-xl",
				lg: "h-11 px-5 py-2.5 gap-2 text-sm rounded-[22px]",
				xl: "h-13 px-8 py-4 gap-2.5 text-base rounded-2xl",
				icon: "size-10",
				"icon-xs": "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",
				"icon-sm": "size-9 rounded-lg",
				"icon-lg": "size-12",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant = "default",
	size = "default",
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot.Root : "button";

	return (
		<Comp
			data-slot="button"
			data-variant={variant}
			data-size={size}
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
