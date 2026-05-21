import { cva, type VariantProps } from "class-variance-authority";

export const colorVariants = cva("", {
	variants: {
		palette: {
			zen: "bg-[#F8F9FA] text-[#ADB5BD]",
			force: "bg-[#212529] text-white",
			sagesse: "bg-[#0B7285] text-white",
			serenite: "bg-[#F1F3F5] text-[#228BE6]",
			nature: "bg-[#EBFBEE] text-[#2B8A3E]",
		},
	},
	defaultVariants: {
		palette: "zen",
	},
});

export type ColorVariantProps = VariantProps<typeof colorVariants>;

export const COLOR_PALETTES = [
	{ id: "zen", name: "Zen", colors: ["#F8F9FA", "#E9ECEF", "#ADB5BD"] },
	{ id: "force", name: "Force", colors: ["#212529", "#343A40", "#E03131"] },
	{ id: "sagesse", name: "Sagesse", colors: ["#0B7285", "#0C8599", "#F08C00"] },
	{
		id: "serenite",
		name: "Sérénité",
		colors: ["#F1F3F5", "#D0EBFF", "#228BE6"],
	},
	{ id: "nature", name: "Nature", colors: ["#EBFBEE", "#B2F2BB", "#2B8A3E"] },
] as const;
