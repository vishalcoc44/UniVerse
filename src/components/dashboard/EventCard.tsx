import { cn } from "@/lib/utils";
import { Calendar, Clock, MapPin, Users, CheckCircle2, Trash2, Pencil, ExternalLink, Ticket, Pin, PinOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface EventCardProps {
	id: string;
	title: string;
	type: string;
	date: string;
	time: string;
	location: string;
	attendees: number;
	imageUrl?: string | null;
	variant?: "rose" | "amber" | "mint" | "lavender" | "sky" | "peach";
	status?: "upcoming" | "live" | "ended";
	isOrganizer?: boolean;
	isPinned?: boolean;
	isRSVPed?: boolean;
	participantLimit?: number | null;
	onDelete?: (id: string) => void;
	onEdit?: (id: string) => void;
	onTogglePin?: (id: string, currentlyPinned: boolean) => void;
	onViewAttendees?: (id: string) => void;
	onRSVP?: (id: string) => void;
	onViewDetails?: (id: string) => void;
}

const variantStyles = {
	rose: "bg-pastel-rose/40 text-pastel-rose-dark border-pastel-rose",
	amber: "bg-pastel-amber/40 text-pastel-amber-dark border-pastel-amber",
	mint: "bg-pastel-mint/40 text-pastel-mint-dark border-pastel-mint",
	lavender: "bg-pastel-lavender/40 text-pastel-lavender-dark border-pastel-lavender",
	sky: "bg-pastel-sky/40 text-pastel-sky-dark border-pastel-sky",
	peach: "bg-pastel-peach/40 text-pastel-peach-dark border-pastel-peach",
};

export function EventCard({
	id,
	title,
	type,
	date,
	time,
	location,
	attendees,
	imageUrl,
	variant = "sky",
	status = "upcoming",
	isOrganizer,
	isPinned = false,
	isRSVPed = false,
	participantLimit = null,
	onDelete,
	onEdit,
	onTogglePin,
	onViewAttendees,
	onRSVP,
	onViewDetails
}: EventCardProps) {
	const dayNumber = date.match(/\d+/)?.[0] || "15";
	const month = date.replace(dayNumber, "").trim() || "Jan";

	return (
		<motion.div
			whileHover={{ y: -5 }}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			onClick={() => onViewDetails?.(id)}
			className={cn(
				"group relative cursor-pointer overflow-hidden rounded-[2rem] border transition-all duration-300 hover:shadow-2xl flex flex-col bg-card/60 backdrop-blur-md",
				variantStyles[variant],
				isPinned && "ring-2 ring-primary ring-offset-2"
			)}
		>
			{/* Image/Cover Section */}
			<div className="relative h-44 w-full overflow-hidden shrink-0">
				{imageUrl ? (
					<img
						src={imageUrl}
						alt={title}
						className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
					/>
				) : (
					<div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-center justify-center">
						<Calendar className="h-12 w-12 opacity-10" />
					</div>
				)}

				{/* Floating Date Badge */}
				<div className="absolute top-4 left-4 z-20 flex gap-2">
					<div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-xl rounded-2xl p-2 flex flex-col items-center min-w-[50px] border border-white/20">
						<span className="text-[10px] uppercase font-black text-primary tracking-tighter">{month}</span>
						<span className="text-xl font-bold text-foreground leading-none">{dayNumber}</span>
					</div>
					{isPinned && (
						<div className="bg-primary shadow-xl rounded-2xl p-2 flex items-center justify-center border border-white/20">
							<Pin className="h-4 w-4 text-white fill-white" />
						</div>
					)}
				</div>

				{/* Status Overlay */}
				<div className="absolute top-4 right-4 z-20">
					<Badge variant="secondary" className={cn(
						"backdrop-blur-md shadow-sm border-none font-bold",
						status === 'live' ? 'bg-red-500 text-white animate-pulse' : 'bg-white/90 text-foreground'
					)}>
						{status === 'live' ? 'LIVE NOW' : type}
					</Badge>
				</div>

				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
			</div>

			{/* Main Info */}
			<div className="p-5 flex-1 flex flex-col space-y-4">
				<div className="space-y-1">
					<h3 className="font-extrabold text-foreground text-xl leading-tight line-clamp-2 min-h-[3rem] group-hover:text-primary transition-colors">
						{title}
					</h3>
					<div className="flex items-center gap-3 text-muted-foreground">
						<div className="flex items-center gap-1.5 text-xs font-semibold">
							<Clock className="h-3.5 w-3.5" />
							<span>{time}</span>
						</div>
						<div className="flex items-center gap-1.5 text-xs font-semibold">
							<MapPin className="h-3.5 w-3.5" />
							<span className="truncate max-w-[120px]">{location}</span>
						</div>
					</div>
				</div>

				{/* Action Area */}
				<div className="flex items-center justify-between pt-2 border-t border-border/10">
					<button
						onClick={() => onViewAttendees?.(id)}
						className="flex -space-x-2 transition-transform hover:scale-105"
					>
						{[...Array(3)].map((_, i) => (
							<div key={i} className="h-7 w-7 rounded-full border-2 border-card bg-secondary flex items-center justify-center overflow-hidden">
								<img src={`https://i.pravatar.cc/100?u=${id}${i}`} alt="avatar" />
							</div>
						))}
						<div className="h-7 px-2 rounded-full border-2 border-card bg-primary/10 text-[10px] font-bold flex items-center justify-center text-primary">
							{participantLimit ? `${attendees}/${participantLimit}` : `+${attendees}`}
						</div>
					</button>

					<div className="flex items-center gap-1">
						{isOrganizer ? (
							<div className="flex items-center bg-background/50 backdrop-blur-sm rounded-xl p-1 shadow-inner border border-border/20" onClick={(e) => e.stopPropagation()}>
								<Button
									variant="ghost"
									size="icon"
									className={cn("h-8 w-8 rounded-lg transition-all", isPinned ? "text-primary hover:bg-primary/10" : "hover:bg-white hover:shadow-sm")}
									onClick={() => onTogglePin?.(id, isPinned)}
								>
									{isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm"
									onClick={() => onEdit?.(id)}
								>
									<Pencil className="h-3.5 w-3.5" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-500 hover:shadow-sm"
									onClick={() => onDelete?.(id)}
								>
									<Trash2 className="h-3.5 w-3.5" />
								</Button>
							</div>
						) : (
							<Button
								onClick={(e) => {
									e.stopPropagation();
									if (!isRSVPed && participantLimit && attendees >= participantLimit) return;
									onRSVP?.(id);
								}}
								size="sm"
								disabled={!isRSVPed && participantLimit !== null && participantLimit !== undefined && attendees >= participantLimit}
								className={cn(
									"rounded-xl h-8 px-4 font-bold shadow-sm hover:shadow-md transition-all",
									isRSVPed ? "bg-green-500 hover:bg-green-600 text-white" : "bg-primary text-white"
								)}
							>
								{isRSVPed ? (
									<>
										<CheckCircle2 className="h-3.5 w-3.5 mr-1" />
										Joined
									</>
								) : participantLimit !== null && participantLimit !== undefined && attendees >= participantLimit ? (
									"Sold Out"
								) : (
									<>
										<Ticket className="h-3.5 w-3.5 mr-1" />
										RSVP
									</>
								)}
							</Button>
						)}
					</div>
				</div>
			</div>
		</motion.div>
	);
}
