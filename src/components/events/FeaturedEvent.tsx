import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, Ticket, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FeaturedEventProps {
	event: {
		id: string;
		title: string;
		type: string;
		date: string;
		time: string;
		location: string;
		attendees: number;
		imageUrl?: string | null;
		isPinned?: boolean;
		isRSVPed?: boolean;
		participantLimit?: number | null;
	};
	onRSVP?: (id: string) => void;
	onViewDetails?: (id: string) => void;
	onViewAttendees?: (id: string) => void;
}

export function FeaturedEvent({ event, onRSVP, onViewDetails, onViewAttendees }: FeaturedEventProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="relative w-full min-h-[400px] rounded-[3rem] overflow-hidden group shadow-2xl border border-white/10"
		>
			<div className="absolute inset-0">
				<img
					src={event.imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop"}
					alt={event.title}
					className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
			</div>

			<div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-12 space-y-4 max-w-3xl">
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.2 }}
					className="flex items-center gap-2"
				>
					<Badge className="bg-primary/90 text-white backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold border-none">
						{event.isPinned ? "📌 PINNED STORY" : "🔥 FEATURING NOW"}
					</Badge>
				</motion.div>

				<motion.h1
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
					className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight"
				>
					{event.title}
				</motion.h1>

				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.4 }}
					className="flex flex-wrap items-center gap-6 text-zinc-300 font-medium"
				>
					<div className="flex items-center gap-2">
						<Calendar className="h-5 w-5 text-primary" />
						<span>{event.date}</span>
					</div>
					<div className="flex items-center gap-2">
						<Clock className="h-5 w-5 text-primary" />
						<span>{event.time}</span>
					</div>
					<div className="flex items-center gap-2">
						<MapPin className="h-5 w-5 text-primary" />
						<span>{event.location}</span>
					</div>
				</motion.div>

				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.5 }}
					className="text-zinc-400 text-lg line-clamp-2 max-w-xl"
				>
					Join the most anticipated event of the month! Experience workshops, networking opportunities, and more with fellow students.
				</motion.p>

				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
					className="flex flex-wrap items-center gap-4 pt-4"
				>
					<Button
						onClick={() => onRSVP?.(event.id)}
						size="lg"
						disabled={!event.isRSVPed && event.participantLimit !== null && event.participantLimit !== undefined && event.attendees >= event.participantLimit}
						className={cn(
							"rounded-full px-8 h-14 text-lg font-black shadow-xl gap-2 transition-all",
							event.isRSVPed ? "bg-green-500 hover:bg-green-600 text-white" : "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
						)}
					>
						{event.isRSVPed ? (
							<>
								<CheckCircle2 className="h-5 w-5" />
								I&apos;m Going!
							</>
						) : event.participantLimit !== null && event.participantLimit !== undefined && event.attendees >= event.participantLimit ? (
							"SOLD OUT"
						) : (
							<>
								<Ticket className="h-5 w-5" />
								Get My Spot
							</>
						)}
					</Button>
					<Button
						onClick={() => onViewDetails?.(event.id)}
						variant="ghost"
						size="lg"
						className="rounded-full px-8 h-14 text-lg font-bold text-white hover:bg-white/10 gap-2"
					>
						Event Details
						<ArrowRight className="h-5 w-5" />
					</Button>
				</motion.div>
			</div>

			<div
				className="absolute bottom-8 right-8 z-20 flex items-center gap-3 cursor-pointer hover:bg-white/10 p-3 -m-3 rounded-2xl transition-all group"
				onClick={() => onViewAttendees?.(event.id)}
			>
				<div className="flex -space-x-3">
					{[...Array(Math.min(event.attendees || 0, 4))].map((_, i) => (
						<div key={i} className="h-10 w-10 rounded-full border-2 border-white/20 bg-zinc-800 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
							<img src={`https://i.pravatar.cc/100?u=feat${i}`} alt="avatar" />
						</div>
					))}
				</div>
				<div className="flex flex-col items-start leading-tight">
					<p className="text-white font-black text-lg">
						{event.attendees || 0}
						<span className="text-zinc-400 font-bold text-sm ml-1 uppercase tracking-tighter">
							{event.attendees === 1 ? 'person' : 'attending'}
						</span>
					</p>
					<p className="text-primary text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">View List</p>
				</div>
			</div>
		</motion.div>
	);
}
