"use client";

import {
	AlertTriangle,
	CheckCircle2,
	Info,
	Loader2,
	XCircle,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			toastOptions={{
				style: {
					borderRadius: "1.5rem",
				},
				classNames: {
					toast:
						"group toast group-[.toaster]:bg-[#FAFAF9] group-[.toaster]:text-stone-800 group-[.toaster]:border-stone-100 group-[.toaster]:shadow-lg group-[.toaster]:rounded-[1.25rem] group-[.toaster]:p-4 group-[.toaster]:font-sans group-[.toaster]:gap-4",
					description: "group-[.toast]:text-stone-500 group-[.toast]:text-sm",
					actionButton:
						"group-[.toast]:bg-stone-900 group-[.toast]:text-white group-[.toast]:rounded-xl group-[.toast]:text-sm",
					cancelButton:
						"group-[.toast]:bg-stone-100 group-[.toast]:text-stone-600 group-[.toast]:rounded-xl group-[.toast]:text-sm",
					title:
						"group-[.toast]:text-stone-800 group-[.toast]:font-medium group-[.toast]:text-base group-[.toast]:font-serif group-[.toast]:text-lg group-[.toast]:font-medium group-[.toast]:text-stone-800",
					content:
						"group-[.toast]:pl-5 group-[.toast]:text-sm group-[.toast]:mt-0.5",
				},
			}}
			icons={{
				success: (
					<div className="w-8 h-8 rounded-xl bg-[#E8F4F0] flex items-center justify-center shrink-0 pl-[2px]">
						<CheckCircle2 strokeWidth={2.5} className="size-4 text-teal-600" />
					</div>
				),
				info: (
					<div className="w-8 h-8 rounded-xl bg-[#E0F2FE] flex items-center justify-center shrink-0">
						<Info strokeWidth={2.5} className="size-4 text-sky-600" />
					</div>
				),
				warning: (
					<div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
						<AlertTriangle
							strokeWidth={2.5}
							className="size-4 text-amber-500"
						/>
					</div>
				),
				error: (
					<div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
						<XCircle strokeWidth={2.5} className="size-4 text-red-500" />
					</div>
				),
				loading: (
					<div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
						<Loader2
							strokeWidth={2.5}
							className="size-4 text-stone-500 animate-spin"
						/>
					</div>
				),
			}}
			{...props}
		/>
	);
};

export { Toaster };
