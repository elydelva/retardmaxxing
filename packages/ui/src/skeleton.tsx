import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="skeleton"
			className={cn("bg-stone-100 rounded-xl animate-pulse", className)}
			{...props}
		/>
	);
}

export { Skeleton };
