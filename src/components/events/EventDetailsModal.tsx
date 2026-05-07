import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, Ticket, Share2, Info, Building, CalendarPlus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface EventDetailsModalProps {
	event: any;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onRSVP: (eventId: string) => void;
	onViewAttendees?: (eventId: string) => void;
	isRSVPed?: boolean;
}

export function EventDetailsModal({
	event,
	isOpen,
	onOpenChange,
	onRSVP,
	onViewAttendees,
	isRSVPed = false
}: EventDetailsModalProps) {
	if (!event) return null;

	const eventDate = event.rawDate || new Date();

	const buildGoogleCalendarUrl = () => {
		const start = event.rawDate ? new Date(event.rawDate) : new Date();
		const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // default 2-hour duration
		const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
		const params = new URLSearchParams({
			action: 'TEMPLATE',
			text: event.title || 'Event',
			dates: `${fmt(start)}/${fmt(end)}`,
			details: event.description || '',
			location: event.location || '',
		});
		return `https://calendar.google.com/calendar/render?${params.toString()}`;
	};

	const handleAddToCalendar = () => {
		window.open(buildGoogleCalendarUrl(), '_blank', 'noopener,noreferrer');
		void import('@/lib/analytics').then(({ track }) => track('add_to_google_calendar', { eventId: event.id })).catch(() => {});
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-5xl p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/50 rounded-[2rem] max-h-[90vh] flex flex-col md:flex-row">
				<DialogHeader className="sr-only">
					<DialogTitle>{event.title}</DialogTitle>
				</DialogHeader>
				<div className="relative w-full md:w-2/5 h-48 md:h-auto shrink-0">
					<img
						src={event.imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87"}
						alt={event.title}
						className="w-full h-full object-cover"
					/>
					<div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-card/40 via-transparent to-transparent" />
					<div className="absolute top-6 left-6 flex gap-2">
                        <Badge variant="secondary" className="backdrop-blur-md bg-black/40 text-white border-white/20 px-3 py-1">
                            {event.type}
                        </Badge>
                    </div>
				</div>

				<div className="p-8 md:p-10 flex-1 overflow-y-auto space-y-6">
					<div className="space-y-6">
						<div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
							<div className="space-y-2">
								<h2 className="text-4xl font-black text-foreground tracking-tight leading-tight">
									{event.title}
								</h2>
								<div className="flex items-center gap-2 text-muted-foreground font-medium">
									<Building className="h-5 w-5 text-primary" />
									<span className="text-lg">{event.scope === 'CAMPUS' ? 'University Event' : 'General Event'}</span>
								</div>
							</div>
							
							<Button 
								onClick={() => onRSVP(event.id)}
								size="lg"
								disabled={!isRSVPed && event.participantLimit !== null && event.attendees >= event.participantLimit}
								className={cn(
									"rounded-2xl h-16 px-10 text-lg font-black gap-3 transition-all shadow-xl shrink-0",
									isRSVPed ? "bg-green-500 hover:bg-green-600 text-white" : "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
								)}
							>
								<Ticket className="h-6 w-6" />
								{isRSVPed ? "Joined!" : (event.participantLimit && event.attendees >= event.participantLimit ? "Sold Out" : "RSVP Now")}
							</Button>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div className="bg-muted/30 rounded-2xl p-4 border border-border/20 flex flex-col gap-1">
								<div className="flex items-center gap-2 text-primary">
									<Calendar className="h-5 w-5" />
									<span className="text-[10px] font-black uppercase tracking-wider">Date</span>
								</div>
								<p className="font-bold text-lg">{event.date}</p>
							</div>
							<div className="bg-muted/30 rounded-2xl p-4 border border-border/20 flex flex-col gap-1">
								<div className="flex items-center gap-2 text-primary">
									<Clock className="h-5 w-5" />
									<span className="text-[10px] font-black uppercase tracking-wider">Time</span>
								</div>
								<p className="font-bold text-lg">{event.time}</p>
							</div>
							<div className="bg-muted/30 rounded-2xl p-4 border border-border/20 flex flex-col gap-1">
								<div className="flex items-center gap-2 text-primary">
									<MapPin className="h-5 w-5" />
									<span className="text-[10px] font-black uppercase tracking-wider">Location</span>
								</div>
								<p className="font-bold text-lg truncate">{event.location}</p>
							</div>
						</div>
					</div>

					<div className="space-y-4">
						<div className="flex items-center gap-2 text-foreground font-black text-xl">
							<Info className="h-6 w-6 text-primary" />
							About this event
						</div>
						<div className="bg-muted/20 rounded-[2rem] p-8 border border-border/10">
							<p className="text-muted-foreground leading-relaxed text-lg">
								{event.description || "Join us for an incredible experience! This event brings together students and enthusiasts for a day of learning, networking, and fun. Don't miss out on this opportunity to connect with your community."}
							</p>
						</div>
					</div>

					<div className="flex items-center justify-between pt-6 border-t border-border/10">
						<div 
							className="flex items-center gap-6 cursor-pointer hover:bg-muted/30 p-2 -m-2 rounded-2xl transition-colors group"
							onClick={() => onViewAttendees?.(event.id)}
						>
							<div className="flex -space-x-4">
								{[...Array(Math.min(event.attendees || 0, 5))].map((_, i) => (
									<div key={i} className="h-12 w-12 rounded-full border-4 border-card bg-secondary flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
										<img src={`https://i.pravatar.cc/100?u=${event.id}${i}`} alt="avatar" />
									</div>
								))}
								{(!event.attendees || event.attendees === 0) && (
									<div className="h-12 w-12 rounded-full border-4 border-card bg-muted flex items-center justify-center shadow-sm">
										<Users className="h-6 w-6 text-muted-foreground" />
									</div>
								)}
							</div>
							<div>
								<p className="text-xl font-black text-foreground">
									{event.attendees || 0}
									<span className="text-muted-foreground font-medium text-base ml-1">
										{event.participantLimit 
											? `/ ${event.participantLimit} spots` 
											: (event.attendees === 1 ? 'person going' : 'people going')}
									</span>
								</p>
								{event.participantLimit && event.attendees >= event.participantLimit ? (
									<p className="text-xs font-bold text-red-500 uppercase tracking-tight">Maximum Capacity Reached</p>
								) : (
									<p className="text-xs font-bold text-primary uppercase tracking-tight">
										{event.attendees > 0 ? "Click to view everyone" : "Be the first to join!"}
									</p>
								)}
							</div>
						</div>
						<div className="flex items-center gap-2 shrink-0">
							<Button
								variant="outline"
								onClick={handleAddToCalendar}
								className="rounded-2xl h-14 px-5 border-border/50 hover:bg-primary/10 hover:text-primary transition-all gap-2 font-bold"
							>
								<CalendarPlus className="h-5 w-5" />
								<span className="hidden sm:inline">Add to Calendar</span>
							</Button>
							<Button variant="outline" size="icon" className="rounded-2xl h-14 w-14 border-border/50 hover:bg-primary/10 hover:text-primary transition-all">
								<Share2 className="h-6 w-6" />
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
