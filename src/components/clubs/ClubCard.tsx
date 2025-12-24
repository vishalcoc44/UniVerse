import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar, ArrowRight, UserPlus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface ClubCardProps {
	id: string;
	name: string;
	description: string;
	category: "Tech" | "Arts" | "Sports" | "Social" | "Academic";
	members: number;
	nextEvent?: string;
	logo: string;
	isJoined?: boolean;
}

const categoryColors = {
	Tech: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900",
	Arts: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-900",
	Sports: "bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-900",
	Social: "bg-pink-500/10 text-pink-600 border-pink-200 dark:border-pink-900",
	Academic: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900",
};

export function ClubCard({
	name,
	description,
	category,
	members,
	nextEvent,
	logo,
	isJoined = false,
}: ClubCardProps) {
	return (
		<Card className="group relative overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl border-border/60">

			{/* Cover Background */}
			<div className="h-28 bg-gradient-to-br from-muted/50 to-muted w-full relative">
				<div className="absolute top-3 right-3 z-10">
					<Badge variant="secondary" className={cn("backdrop-blur-md shadow-sm", categoryColors[category])}>
						{category}
					</Badge>
				</div>
			</div>

			<CardContent className="pt-0 flex-1 flex flex-col">
				{/* Header Row: Logo overlaps cover + Join Button */}
				<div className="flex justify-between items-start -mt-10 mb-3 px-1">
					<div className="h-20 w-20 rounded-2xl bg-card border-[3px] border-card shadow-md flex items-center justify-center text-4xl shrink-0 group-hover:scale-105 transition-transform duration-300">
						{logo}
					</div>

					<div className="pt-12">
						{isJoined ? (
							<Badge variant="outline" className="gap-1 border-green-200 text-green-600 bg-green-50">
								<Check className="h-3 w-3" /> Member
							</Badge>
						) : (
							<Button size="sm" className="h-8 rounded-full px-4 shadow-sm" variant="default">
								Join
							</Button>
						)}
					</div>
				</div>

				{/* Text Content */}
				<div className="space-y-3 mb-4 flex-1">
					<div>
						<h3 className="font-bold text-xl leading-tight text-foreground group-hover:text-primary transition-colors duration-200">
							{name}
						</h3>
						<p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
							{description}
						</p>
					</div>
				</div>

				<Separator className="bg-border/60 mb-4" />

				{/* Footer Stats */}
				<div className="space-y-3">
					<div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
						<div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
							<Users className="h-3.5 w-3.5 opacity-70" />
							<span>{members} members</span>
						</div>
						{nextEvent && (
							<div className="flex items-center gap-1.5 text-primary">
								<Calendar className="h-3.5 w-3.5" />
								<span>{nextEvent}</span>
							</div>
						)}
					</div>

					<Button variant="ghost" className="w-full justify-between text-muted-foreground hover:text-primary hover:bg-primary/5 h-9 text-sm font-normal group/btn">
						Visit Club Page
						<ArrowRight className="h-4 w-4 opacity-50 transition-transform group-hover/btn:translate-x-1 group-hover/btn:opacity-100" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
