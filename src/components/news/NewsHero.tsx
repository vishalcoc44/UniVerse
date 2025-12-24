import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Calendar, Clock } from "lucide-react";

export function NewsHero() {
	return (
		<div className="relative rounded-2xl overflow-hidden min-h-[400px] flex items-end group">
			<div className="absolute inset-0">
				<img
					src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070&auto=format&fit=crop"
					alt="Campus Event"
					className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
			</div>

			<div className="relative z-10 p-8 md:p-12 w-full max-w-4xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
				<Badge className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm py-1 px-3">
					Featured Story
				</Badge>
				<h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
					University Annual Tech Fest "CyberNova 2025" Announced
				</h1>
				<p className="text-zinc-200 text-lg md:text-xl line-clamp-2 max-w-2xl">
					Join the biggest technology innovation showcase of the year. Hackathons, workshops, and guest lectures from industry leaders await.
				</p>

				<div className="flex items-center gap-6 text-zinc-300 pt-2">
					<div className="flex items-center gap-2 text-sm font-medium">
						<Calendar className="h-4 w-4" />
						<span>March 15-17, 2025</span>
					</div>
					<div className="flex items-center gap-2 text-sm font-medium">
						<Clock className="h-4 w-4" />
						<span>5 min read</span>
					</div>
				</div>

				<div className="pt-4">
					<Button size="lg" className="rounded-full gap-2 text-base">
						Read Full Story
						<ArrowRight className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
