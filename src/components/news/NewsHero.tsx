import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock } from "lucide-react";

interface FeaturedNews {
	title: string;
	excerpt: string;
	category: string;
	date: string;
	readTime: string;
	image?: string | null;
}

interface NewsHeroProps {
	featured?: FeaturedNews | null;
}

export function NewsHero({ featured }: NewsHeroProps) {
	const item = featured ?? {
		title: "Campus updates and announcements",
		excerpt: "Latest announcements from your university community are posted here.",
		category: "Featured Story",
		date: "Just now",
		readTime: "2 min read",
		image: null,
	};

	return (
		<div className="relative rounded-2xl overflow-hidden min-h-[400px] flex items-end group">
			<div className="absolute inset-0">
				{item.image ? (
					<img
						src={item.image}
						alt={item.title}
						className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
					/>
				) : (
					<div className="w-full h-full bg-gradient-to-br from-primary/30 via-muted to-card" />
				)}
				<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
			</div>

			<div className="relative z-10 p-8 md:p-12 w-full max-w-4xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
				<Badge className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm py-1 px-3">
					{item.category}
				</Badge>
				<h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
					{item.title}
				</h1>
				<p className="text-zinc-200 text-lg md:text-xl line-clamp-2 max-w-2xl">
					{item.excerpt}
				</p>

				<div className="flex items-center gap-6 text-zinc-300 pt-2">
					<div className="flex items-center gap-2 text-sm font-medium">
						<Calendar className="h-4 w-4" />
						<span>{item.date}</span>
					</div>
					<div className="flex items-center gap-2 text-sm font-medium">
						<Clock className="h-4 w-4" />
						<span>{item.readTime}</span>
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
