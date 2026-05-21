import type * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				"w-full min-h-24 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition-all duration-200",
				"placeholder:text-stone-400",
				"hover:border-stone-300",
				"focus:border-stone-400",
				"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				"aria-invalid:border-red-300 aria-invalid:focus:border-red-400",
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };
