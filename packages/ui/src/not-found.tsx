import { Button } from "@swaya/ui/button";
import { Home } from "lucide-react";

interface NotFoundProps {
	href?: string;
	label?: string;
}

export function NotFound({
	href = "/",
	label = "Retour à l'accueil",
}: NotFoundProps) {
	return (
		<div className="min-h-screen bg-[#F6F4ED] flex items-center justify-center p-4">
			<div className="max-w-md w-full text-center space-y-8">
				{/* The big 404 */}
				<h1 className="font-serif text-[120px] md:text-[160px] font-bold text-stone-900 leading-none tracking-tighter">
					404
				</h1>

				<div className="space-y-3">
					<h2 className="font-serif text-2xl md:text-3xl font-medium text-stone-800">
						Page introuvable
					</h2>
					<p className="text-stone-500 text-sm md:text-base max-w-[280px] mx-auto leading-relaxed">
						Désolé, la page que vous recherchez n&apos;existe pas ou a été
						déplacée.
					</p>
				</div>

				<div className="pt-4">
					<Button asChild size="xl">
						<a href={href}>
							<Home className="w-4 h-4" />
							{label}
						</a>
					</Button>
				</div>

				{/* Subtle branding placeholder */}
				<div className="pt-12">
					<p className="font-serif text-xl font-bold tracking-tight text-stone-300">
						Swaya.
					</p>
				</div>
			</div>
		</div>
	);
}
