import * as React from "react";
import { Input } from "./input";
import { cn } from "./utils";

export type UnitType = "percent" | "currency" | "days" | "hours" | "minutes";

const unitConfig: Record<
	UnitType,
	{ suffix: string; min?: number; max?: number }
> = {
	percent: { suffix: "%", min: 0, max: 100 },

	currency: { suffix: "€", min: 0 },

	days: { suffix: "J", min: 0 },

	hours: { suffix: "H", min: 0 },

	minutes: { suffix: "M", min: 0 },
};

interface UnitInputProps
	extends Omit<React.ComponentProps<typeof Input>, "type"> {
	unit: UnitType;
}

const UnitInput = React.forwardRef<HTMLInputElement, UnitInputProps>(
	({ className, unit, ...props }, ref) => {
		const config = unitConfig[unit];
		return (
			<div className="relative w-full group/unit">
				<Input
					type="number"
					ref={ref}
					className={cn("pr-10", className)}
					min={config.min ?? props.min}
					max={config.max ?? props.max}
					{...props}
				/>
				<span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-stone-400 pointer-events-none group-focus-within/unit:text-stone-600 transition-colors uppercase">
					{config.suffix}
				</span>
			</div>
		);
	},
);
UnitInput.displayName = "UnitInput";

export { UnitInput };
