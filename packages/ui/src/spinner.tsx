import { Loader2 } from "lucide-react";
import { cn } from "./utils";

function Spinner({
	className,
	strokeWidth = 2,
	...props
}: React.ComponentProps<"svg">) {
	return (
		<Loader2
			strokeWidth={typeof strokeWidth === "number" ? strokeWidth : 2}
			role="status"
			aria-label="Loading"
			className={cn("size-4 animate-spin", className)}
			{...props}
		/>
	);
}

export { Spinner };
