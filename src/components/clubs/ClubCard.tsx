import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, Check, Loader2, Globe2, School, Crown, Sparkles, ExternalLink, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ClubCardProps {
	id: string;
	name: string;
	description: string;
	category: string;
	members: number;
	logoUrl?: string | null;
	scope?: "CAMPUS" | "UNIVERSE";
	isJoined?: boolean;
	isOwner?: boolean;
	onToggleJoin?: (clubId: string, joined: boolean) => void;
	onDelete?: (clubId: string) => void;
	joinLoading?: boolean;
}

const categoryStyles = {
	Tech: "bg-blue-500/20 text-blue-400 border-blue-500/30",
	Arts: "bg-purple-500/20 text-purple-400 border-purple-500/30",
	Sports: "bg-orange-500/20 text-orange-400 border-orange-500/30",
	Social: "bg-pink-500/20 text-pink-400 border-pink-500/30",
	Academic: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

export function ClubCard({
	id,
	name,
	description,
	category,
	members,
	logoUrl,
	scope = "CAMPUS",
	isJoined = false,
	isOwner = false,
	onToggleJoin,
	onDelete,
	joinLoading = false,
}: ClubCardProps) {
	const currentStyle = (category as keyof typeof categoryStyles) in categoryStyles
		? categoryStyles[category as keyof typeof categoryStyles]
		: categoryStyles.Social;

	return (
		<motion.div
			whileHover={{ y: -8, scale: 1.02 }}
			transition={{ type: "spring", stiffness: 300, damping: 20 }}
			className="h-full"
		>
			<Card className="group relative h-full bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] overflow-hidden flex flex-col transition-shadow hover:shadow-2xl hover:shadow-primary/5">
				{/* Header/Cover Image Area */}
				<div className="relative h-32 overflow-hidden">
					<div className={cn(
						"absolute inset-0 bg-gradient-to-br transition-opacity duration-500 group-hover:opacity-80",
						scope === "UNIVERSE" ? "from-violet-600/30 via-primary/20 to-transparent" : "from-emerald-600/30 via-secondary/20 to-transparent"
					)} />

					<div className="absolute top-4 right-4 flex flex-col items-end gap-2">
						<Badge className={cn("px-4 py-1 rounded-xl font-black italic tracking-widest text-[9px] uppercase border", currentStyle)}>
							{category}
						</Badge>
						<Badge variant="outline" className="bg-black/20 backdrop-blur-md border-white/10 text-[9px] font-black uppercase tracking-widest text-white/80 transition-all group-hover:border-primary/50">
							{scope === "UNIVERSE" ? <Globe2 className="h-3 w-3 mr-1.5" /> : <School className="h-3 w-3 mr-1.5" />}
							{scope === "UNIVERSE" ? "Cosmos" : "Local"}
						</Badge>
					</div>

					<div className="absolute -bottom-1 -left-1 px-8">
						<div className="h-20 w-20 rounded-3xl bg-card/80 backdrop-blur-2xl border-4 border-background overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 flex items-center justify-center">
							{logoUrl ? (
								<img src={logoUrl} alt={name} className="h-full w-full object-cover" />
							) : (
								<span className="text-3xl font-black italic tracking-tighter text-primary">
									{name.charAt(0)}
								</span>
							)}
						</div>
					</div>
				</div>

				<CardContent className="pt-12 px-8 flex-1 flex flex-col">
					<div className="space-y-4 flex-1">
						<div className="flex items-center justify-between">
							<h3 className="text-2xl font-black italic tracking-tighter text-foreground group-hover:text-primary transition-colors leading-none">
								{name}
							</h3>
							{members > 500 && <Crown className="h-4 w-4 text-primary animate-pulse" />}
						</div>

						<p className="text-sm font-medium text-muted-foreground italic tracking-tight leading-relaxed line-clamp-2">
							{description}
						</p>

						<div className="flex items-center gap-6 pt-2">
							<div className="flex flex-col">
								<span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 italic mb-1">Impact</span>
								<div className="flex items-center gap-2">
									<div className="relative flex h-2 w-2">
										<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
										<span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
									</div>
									<span className="text-lg font-black italic tracking-tighter">{members}</span>
									<span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Souls</span>
								</div>
							</div>

							<div className="flex flex-col">
								<span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 italic mb-1">Status</span>
								<div className="flex items-center gap-1.5">
									<Sparkles className="h-3 w-3 text-secondary" />
									<span className="text-[10px] font-black uppercase tracking-widest text-foreground italic">Trending</span>
								</div>
							</div>
						</div>
					</div>

					<div className="mt-8 pt-6 border-t border-border/10 flex items-center justify-between gap-4">
						<div className="flex gap-2">
							<Button
								variant="ghost"
								className="h-12 w-12 rounded-2xl bg-muted/20 hover:bg-muted text-muted-foreground hover:text-foreground"
							>
								<ExternalLink className="h-5 w-5" />
							</Button>
							{isOwner && onDelete && (
								<Button
									variant="ghost"
									onClick={() => onDelete(id)}
									className="h-12 w-12 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-500 transition-colors"
								>
									<Trash2 className="h-5 w-5" />
								</Button>
							)}
						</div>

						{isJoined ? (
							<Button
								variant="outline"
								onClick={() => onToggleJoin?.(id, true)}
								disabled={joinLoading}
								className="h-12 px-8 rounded-2xl font-black italic tracking-tighter border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 flex-1 transition-all"
							>
								{joinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
								STATIONED
							</Button>
						) : (
							<Button
								onClick={() => onToggleJoin?.(id, false)}
								disabled={joinLoading}
								className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black italic tracking-tighter shadow-xl shadow-primary/20 group/btn flex-1 transition-all"
							>
								{joinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2 group-hover/btn:translate-x-1 transition-transform" />}
								INITIATE CONTACT
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}
