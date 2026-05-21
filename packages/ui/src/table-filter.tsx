import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "./utils";

export interface TableFilterOption {
	value: string | number | null;
	label: string;
}

export interface TableFilterProps {
	icon: ReactNode;
	label: string;
	value: string | number | null;
	options: TableFilterOption[];
	onChange: (value: string | number | null) => void;
	width?: string;
}

export function TableFilter({
	icon,
	label,
	value,
	options,
	onChange,
	width = "w-40",
}: TableFilterProps) {
	const displayValue = value
		? (options.find((opt) => opt.value === value)?.label ?? String(value))
		: label;

	const isDisabled = options.length === 0;

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="tertiary"
					size="sm"
					disabled={isDisabled}
					className={cn(
						"h-10 rounded-2xl gap-2",
						isDisabled
							? "text-stone-300 cursor-not-allowed bg-stone-50"
							: "text-stone-600 hover:text-stone-800 hover:bg-white",
					)}
				>
					{icon}
					{displayValue}
					<ChevronDown className="w-3.5 h-3.5 text-stone-400" />
				</Button>
			</PopoverTrigger>
			{!isDisabled && (
				<PopoverContent className={cn("p-1", width)} align="start">
					<div className="flex flex-col">
						<button
							onClick={() => onChange(null)}
							className={cn(
								"px-3 py-2 text-sm text-left rounded-xl transition-colors",
								!value
									? "bg-[#FFF0E3] text-stone-800"
									: "text-stone-600 hover:bg-stone-100",
							)}
						>
							Tous les {label.toLowerCase()}s
						</button>
						{options.map((option) => (
							<button
								key={option.value ?? "null"}
								onClick={() => onChange(option.value)}
								className={cn(
									"px-3 py-2 text-sm text-left rounded-xl transition-colors",
									value === option.value
										? "bg-[#FFF0E3] text-stone-800"
										: "text-stone-600 hover:bg-stone-100",
								)}
							>
								{option.label}
							</button>
						))}
					</div>
				</PopoverContent>
			)}
		</Popover>
	);
}
