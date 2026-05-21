import type * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"h-11 w-full min-w-0 rounded-2xl bg-white px-4 text-sm text-stone-800 outline-none transition-[color,background-color,border-color,box-shadow] duration-200",
				"placeholder:text-stone-400",
				"border-stone-200",
				"bg-stone-50 focus:bg-stone-100 focus:border-stone-300",
				"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				"file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-stone-700",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
