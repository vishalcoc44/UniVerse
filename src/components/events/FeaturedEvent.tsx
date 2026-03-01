import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Ticket, ArrowRight, CheckCircle2, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

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
		description?: string;
		rawDate?: Date;
	};
	onRSVP?: (id: string) => void;
	onViewDetails?: (id: string) => void;
	onViewAttendees?: (id: string) => void;
}

function useCountdown(targetDate?: Date) {
	const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

	useEffect(() => {
		if (!targetDate) return;

		const calculate = () => {
			const now = new Date().getTime();
			const target = targetDate.getTime();
			const diff = target - now;

			if (diff <= 0) {
				setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
				return;
			}

			setTimeLeft({
				days: Math.floor(diff / (1000 * 60 * 60 * 24)),
				hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
				minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
				seconds: Math.floor((diff % (1000 * 60)) / 1000),
				isPast: false
			});
		};

		calculate();
		const interval = setInterval(calculate, 1000);
		return () => clearInterval(interval);
	}, [targetDate]);

	return timeLeft;
}

export function FeaturedEvent({ event, onRSVP, onViewDetails, onViewAttendees }: FeaturedEventProps) {
	const countdown = useCountdown(event.rawDate);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="relative w-full min-h-[420px] rounded-[3rem] overflow-hidden group shadow-2xl border border-white/10"
		>
			<div className="absolute inset-0">
				<img
					src={event.imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop"}
					alt={event.title}
					className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
			</div>

			{/* Countdown Timer — top right */}
			{!countdown.isPast && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="absolute top-6 right-6 z-20 flex items-center gap-3 bg-black/50 backdrop-blur-lg border border-white/10 rounded-2xl px-4 py-3"
				>
					<Timer className="h-4 w-4 text-primary shrink-0" />
					<div className="flex items-center gap-2 text-white font-black text-sm tabular-nums">
						{countdown.days > 0 && (
							<span className="flex flex-col items-center leading-none">
								<span className="text-lg">{String(countdown.days).padStart(2, '0')}</span>
								<span className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">Days</span>
							</span>
						)}
						{countdown.days > 0 && <span className="text-zinc-500 text-lg">:</span>}
						<span className="flex flex-col items-center leading-none">
							<span className="text-lg">{String(countdown.hours).padStart(2, '0')}</span>
							<span className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">Hrs</span>
						</span>
						<span className="text-zinc-500 text-lg">:</span>
						<span className="flex flex-col items-center leading-none">
							<span className="text-lg">{String(countdown.minutes).padStart(2, '0')}</span>
							<span className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">Min</span>
						</span>
						<span className="text-zinc-500 text-lg">:</span>
						<span className="flex flex-col items-center leading-none">
							<span className="text-lg text-primary">{String(countdown.seconds).padStart(2, '0')}</span>
							<span className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">Sec</span>
						</span>
					</div>
				</motion.div>
			)}
			{countdown.isPast && (
				<div className="absolute top-6 right-6 z-20 bg-red-500/80 backdrop-blur-lg border border-red-400/20 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-2xl">
					Event Ended
				</div>
			)}

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
					<Badge className="bg-white/10 text-white backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold border-none">
						{event.type}
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

				{event.description && (
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.5 }}
						className="text-zinc-400 text-base line-clamp-2 max-w-xl"
					>
						{event.description.replace(/\[Category:.*?\]/g, '').trim() || "Join the most anticipated event of the month!"}
					</motion.p>
				)}

				{/* Attendance progress */}
				{event.participantLimit && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="max-w-sm">
						<div className="flex justify-between text-xs text-zinc-400 font-bold mb-1">
							<span>{event.attendees} attending</span>
							<span>{event.participantLimit - event.attendees} spots left</span>
						</div>
						<div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
							<div
								className={cn("h-full rounded-full transition-all", event.attendees / event.participantLimit >= 0.9 ? "bg-red-500" : "bg-primary")}
								style={{ width: `${Math.min(100, (event.attendees / event.participantLimit) * 100)}%` }}
							/>
						</div>
					</motion.div>
				)}

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
							<><CheckCircle2 className="h-5 w-5" /> I&apos;m Going!</>
						) : event.participantLimit !== null && event.participantLimit !== undefined && event.attendees >= event.participantLimit ? (
							"SOLD OUT"
						) : (
							<><Ticket className="h-5 w-5" /> Get My Spot</>
						)}
					</Button>
					<Button
						onClick={() => onViewDetails?.(event.id)}
						variant="ghost"
						size="lg"
						className="rounded-full px-8 h-14 text-lg font-bold text-white hover:bg-white/10 gap-2"
					>
						Event Details <ArrowRight className="h-5 w-5" />
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
