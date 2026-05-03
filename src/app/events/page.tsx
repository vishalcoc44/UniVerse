'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EventCard } from "@/components/dashboard/EventCard";
import { EventCreationModal } from "@/components/events/EventCreationModal";
import { FeaturedEvent } from "@/components/events/FeaturedEvent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Filter, LayoutGrid, List, Loader2, Search, PlusCircle, Sparkles, Bookmark, TrendingUp, Users } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { format, isFuture } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import { useUserUniversity } from "@/hooks/useUserUniversity";
import { EventAttendeesModal } from "@/components/events/EventAttendeesModal";
import { EventDetailsModal } from "@/components/events/EventDetailsModal";
import { toast } from "sonner";

const categories = ["All", "Workshop", "Social", "Academic", "Sports", "General"];

const containerVariants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1
		}
	}
};

export default function EventsPage() {
	const [view, setView] = useState<"grid" | "list">("grid");
	const [events, setEvents] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
	const [viewingEvent, setViewingEvent] = useState<any | null>(null);
	const [editingEvent, setEditingEvent] = useState<any>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [userRSVPs, setUserRSVPs] = useState<string[]>([]);
	const { universityId, loading: uniLoading } = useUserUniversity();
	const [searchTerm, setSearchTerm] = useState("");
	const [activeScope, setActiveScope] = useState<'campus' | 'universe' | 'mine'>('campus');
	const [selectedCategory, setSelectedCategory] = useState("All");

	useEffect(() => {
		supabase.auth.getUser().then(({ data: { user } }) => {
			if (user) setCurrentUserId(user.id);
		});
	}, []);

	const fetchEvents = async () => {
		setLoading(true);
		try {
			// Fetch events and attendee counts in one go if possible, but let's keep it simple first
			let query = supabase
				.from('Event')
				.select(`
					*,
					attendees:EventRSVP(count)
				`)
				.order('date', { ascending: true });

			if (activeScope === 'campus') {
				if (universityId) {
					query = query.eq('scope', 'CAMPUS').eq('universityId', universityId);
				} else {
					setEvents([]);
					setLoading(false);
					return;
				}
			} else if (activeScope === 'universe') {
				query = query.eq('scope', 'UNIVERSE');
			} else {
				// 'mine' — fetch all campus + universe events, filter client-side by RSVPs
				if (universityId) {
					query = query.or(`scope.eq.UNIVERSE,and(scope.eq.CAMPUS,universityId.eq.${universityId})`);
				} else {
					query = query.eq('scope', 'UNIVERSE');
				}
			}

			const { data, error } = await query;
			if (error) throw error;

			// Fetch current user's RSVPs
			if (currentUserId) {
				const { data: rsvpData } = await supabase
					.from('EventRSVP')
					.select('eventId')
					.eq('userId', currentUserId);

				if (rsvpData) {
					setUserRSVPs(rsvpData.map(r => r.eventId));
				}
			}

			const mappedEvents = data?.map(event => {
				const eventDate = new Date(event.date);
				const categoryMatch = event.description?.match(/\[Category: (.*?)\]/);
				const category = categoryMatch ? categoryMatch[1] : "General";

				return {
					id: event.id,
					title: event.title,
					type: category,
					date: format(eventDate, "MMM d"),
					time: format(eventDate, "h:mm a"),
					location: event.location || "TBD",
					attendees: (event.attendees?.[0] as any)?.count || 0,
					imageUrl: event.imageUrl || event.image_url || event.imageurl,
					organizerId: event.organizerId,
					isPinned: event.isPinned || false,
					participantLimit: event.participantLimit,
					description: event.description || "",
					scope: event.scope,
					variant: ["sky", "rose", "amber", "mint", "lavender", "peach"][Math.floor(Math.random() * 6)],
					status: isFuture(eventDate) ? "upcoming" : "ended" as const,
					rawDate: eventDate
				};
			}) || [];

			setEvents(mappedEvents);
		} catch (error: any) {
			console.error("Error fetching events:", error);
			toast.error(`Failed to load events: ${error.message}`);
		} finally {
			setLoading(false);
		}
	};

	const filteredEvents = useMemo(() => {
		return events.filter((event) => {
			const matchesSearch = !searchTerm.trim() ||
				`${event.title} ${event.location} ${event.type}`.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesCategory = selectedCategory === "All" || event.type?.toLowerCase() === selectedCategory.toLowerCase();
			const matchesMine = activeScope !== 'mine' || userRSVPs.includes(event.id);
			return matchesSearch && matchesCategory && matchesMine;
		});
	}, [events, searchTerm, selectedCategory, activeScope, userRSVPs]);

	const featuredEvent = useMemo(() => {
		// Prioritize pinned events
		const pinned = filteredEvents.find(e => e.isPinned);
		if (pinned) return pinned;
		return filteredEvents.find(e => e.status === 'upcoming') || filteredEvents[0];
	}, [filteredEvents]);

	const otherEvents = useMemo(() => {
		if (!featuredEvent) return filteredEvents;
		return filteredEvents.filter(e => e.id !== featuredEvent.id);
	}, [filteredEvents, featuredEvent]);

	const handleTogglePin = async (eventId: string, currentlyPinned: boolean) => {
		try {
			// Check if another event is already pinned? Usually only one is featured.
			// But for now, let's just toggle.
			const { error } = await supabase.from('Event').update({ isPinned: !currentlyPinned }).eq('id', eventId);
			if (error) throw error;

			setEvents(prev => prev.map(e => e.id === eventId ? { ...e, isPinned: !currentlyPinned } : e));
			toast.success(!currentlyPinned ? "Event pinned to featured section!" : "Event unpinned.");
		} catch (error: any) {
			toast.error(`Failed to pin event: ${error.message}`);
		}
	};

	const handleDeleteEvent = async (eventId: string) => {
		try {
			const { data, error } = await supabase.from('Event').delete().eq('id', eventId).select();
			if (error) throw error;
			if (!data || data.length === 0) throw new Error("Could not delete. Permission denied.");

			setEvents(prev => prev.filter(e => e.id !== eventId));
			toast.success("Event deleted successfully!");
		} catch (error: any) {
			toast.error(error.message);
		}
	};

	const handleEditEvent = async (eventId: string) => {
		const { data, error } = await supabase
			.from('Event')
			.select('*')
			.eq('id', eventId)
			.single();

		if (error) {
			toast.error("Could not load event details.");
		} else {
			setEditingEvent(data);
			setIsEditModalOpen(true);
		}
	};

	const handleViewAttendees = (eventId: string) => {
		setSelectedEventId(eventId);
	};

	const handleRSVP = async (eventId: string) => {
		if (!currentUserId) {
			toast.error("Please login to RSVP.");
			return;
		}

		try {
			const isAlreadyRSVPed = userRSVPs.includes(eventId);

			if (isAlreadyRSVPed) {
				// Cancel RSVP
				const { error } = await supabase
					.from('EventRSVP')
					.delete()
					.eq('eventId', eventId)
					.eq('userId', currentUserId);

				if (error) throw error;
				setUserRSVPs(prev => prev.filter(id => id !== eventId));
				// Update local event attendee count
				setEvents(prev => prev.map(e => e.id === eventId ? { ...e, attendees: Math.max(0, e.attendees - 1) } : e));
				toast.info("RSVP cancelled.");
			} else {
				// Join RSVP
				const { error } = await supabase
					.from('EventRSVP')
					.insert({
						eventId,
						userId: currentUserId,
						status: 'GOING'
					});

				if (error) throw error;
				setUserRSVPs(prev => [...prev, eventId]);
				// Update local event attendee count
				setEvents(prev => prev.map(e => e.id === eventId ? { ...e, attendees: e.attendees + 1 } : e));
				toast.success("Spot secured! See you there.");
			}
		} catch (error: any) {
			toast.error(`RSVP failed: ${error.message}`);
		}
	};

	const handleViewDetails = (eventId: string) => {
		const ev = events.find(e => e.id === eventId);
		setViewingEvent(ev);
	};

	const handleModalOpenChange = (open: boolean) => {
		setIsEditModalOpen(open);
		if (!open) setEditingEvent(null);
	};

	useEffect(() => {
		if (!uniLoading && activeScope !== 'mine') fetchEvents();
		if (activeScope === 'mine') fetchEvents();
	}, [uniLoading, universityId, activeScope]);

	// Quick stats
	const stats = useMemo(() => ({
		total: events.length,
		upcoming: events.filter(e => e.status === 'upcoming').length,
		rsvped: userRSVPs.length,
	}), [events, userRSVPs]);

	return (
		<DashboardLayout
			title={<>Events <span className="text-primary">Central</span></>}
			icon={CalendarIcon}
			subtitle="Where campus life happens."
			breadcrumb={["UniVerse", "Events"]}
		>
			<div className="max-w-7xl mx-auto space-y-8 pb-20">
				{/* Top Actions & Filters Banner */}
				<div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
					<div className="flex flex-col gap-4 w-full lg:w-auto">
					<div className="flex items-center gap-2 sm:gap-3 flex-wrap">
						<Tabs value={activeScope} onValueChange={(v) => setActiveScope(v as any)} className="w-auto">
							<TabsList className="h-10 sm:h-12 bg-muted/50 p-1 rounded-2xl border border-border/20 backdrop-blur-md">
								<TabsTrigger value="campus" className="rounded-xl px-3 sm:px-5 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm font-bold">
									Campus
								</TabsTrigger>
								<TabsTrigger value="universe" className="rounded-xl px-3 sm:px-5 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm font-bold">
									Universe
								</TabsTrigger>
								<TabsTrigger value="mine" className="rounded-xl px-3 sm:px-5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm text-xs sm:text-sm font-bold gap-1 sm:gap-1.5">
									<Bookmark className="h-3.5 w-3.5" /> <span className="hidden sm:inline">My </span>Events
									{userRSVPs.length > 0 && (
										<span className="ml-1 bg-primary text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center">{userRSVPs.length}</span>
									)}
								</TabsTrigger>
							</TabsList>
						</Tabs>

						<div className="bg-muted/50 p-1 rounded-2xl border border-border/20 flex backdrop-blur-md">
							<Button
								variant={view === "grid" ? "secondary" : "ghost"}
								size="icon"
								className="h-10 w-10 rounded-xl"
								onClick={() => setView("grid")}
							>
								<LayoutGrid className="h-5 w-5" />
							</Button>
							<Button
								variant={view === "list" ? "secondary" : "ghost"}
								size="icon"
								className="h-10 w-10 rounded-xl"
								onClick={() => setView("list")}
							>
								<List className="h-5 w-5" />
							</Button>
						</div>
					</div>

						<div className="relative w-full md:min-w-[400px]">
							<Input
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Search events, locations, categories..."
								className="pl-11 h-12 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-border/50 rounded-2xl focus:ring-primary shadow-sm"
							/>
							<Search className="absolute left-4 top-4 h-4 w-4 text-muted-foreground" />
						</div>
					</div>

					<div className="flex items-center gap-3 w-full lg:w-auto">
						<EventCreationModal
							isOpen={isEditModalOpen}
							onOpenChange={handleModalOpenChange}
							eventToEdit={editingEvent}
							onEventCreated={fetchEvents}
						/>
						<Button
							size="lg"
							onClick={() => setIsEditModalOpen(true)}
							className="h-12 rounded-2xl px-6 bg-primary text-white font-bold gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
						>
							<PlusCircle className="h-5 w-5" />
							Host Event
						</Button>
					</div>
				</div>

				{/* Stats Banner */}
				{!loading && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="grid grid-cols-3 gap-2 sm:gap-4"
					>
						{[
							{ label: 'Total Events', value: stats.total, icon: CalendarIcon, color: 'text-primary' },
							{ label: 'Upcoming', value: stats.upcoming, icon: TrendingUp, color: 'text-green-500' },
							{ label: 'My RSVPs', value: stats.rsvped, icon: Bookmark, color: 'text-amber-500' },
						].map(({ label, value, icon: Icon, color }) => (
							<div key={label} className="bg-card/50 backdrop-blur-xl border border-border/30 rounded-2xl px-3 py-3 sm:px-5 sm:py-4 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 shadow-sm text-center sm:text-left">
								<div className={cn("h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-muted/60 flex items-center justify-center", color)}>
									<Icon className="h-4 w-4 sm:h-5 sm:w-5" />
								</div>
								<div>
									<p className="text-lg sm:text-2xl font-black">{value}</p>
									<p className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
								</div>
							</div>
						))}
					</motion.div>
				)}

				{/* Featured Banner */}
				{!loading && featuredEvent && !searchTerm && selectedCategory === "All" && activeScope !== 'mine' && (
					<div className="max-w-5xl mx-auto w-full">
						<FeaturedEvent
							event={{
								...featuredEvent,
								isRSVPed: userRSVPs.includes(featuredEvent.id)
							}}
							onRSVP={handleRSVP}
							onViewDetails={handleViewDetails}
							onViewAttendees={handleViewAttendees}
						/>
					</div>
				)}

				{/* Category Quick Filters */}
				<div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
					{categories.map((cat) => (
						<Button
							key={cat}
							variant={selectedCategory === cat ? "default" : "outline"}
							onClick={() => setSelectedCategory(cat)}
							className={cn(
								"rounded-full px-6 transition-all duration-300 border-border/40 font-semibold",
								selectedCategory === cat ? "shadow-lg scale-105" : "bg-card/50 hover:bg-card"
							)}
						>
							{cat}
						</Button>
					))}
				</div>

				{/* Events Section */}
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<h2 className="text-2xl font-black flex items-center gap-2">
							<Sparkles className="h-6 w-6 text-primary" />
							{searchTerm || selectedCategory !== "All" ? "Search Results" : "Upcoming Events"}
							<span className="text-muted-foreground font-medium ml-2 text-sm bg-muted/50 px-3 py-1 rounded-full">
								{filteredEvents.length} total
							</span>
						</h2>
					</div>

					{loading ? (
						<div className="flex flex-col items-center justify-center py-20 gap-4">
							<Loader2 className="h-10 w-10 animate-spin text-primary" />
							<p className="text-muted-foreground font-medium animate-pulse">Gathering campus happenings...</p>
						</div>
					) : filteredEvents.length === 0 ? (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="text-center py-12 sm:py-24 bg-card/20 rounded-2xl sm:rounded-[3rem] border-2 border-dashed border-border/50"
						>
							<CalendarIcon className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
							<h3 className="text-xl font-bold mb-2">No events found</h3>
							<p className="text-muted-foreground max-w-sm mx-auto">
								{activeScope === 'campus' && !universityId
									? 'Explore university settings to link your campus and see local events.'
									: `We couldn't find any events matching your criteria. Try changing your search or filters.`}
							</p>
						</motion.div>
					) : (
						<motion.div
							variants={containerVariants}
							initial="hidden"
							animate="show"
							className={cn(
								view === "grid"
									? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
									: "flex flex-col gap-4"
							)}
						>
							{(otherEvents.length > 0 ? otherEvents : filteredEvents).map((event) => (
								<EventCard
									key={event.id}
									{...event}
									isOrganizer={currentUserId === event.organizerId}
									isPinned={event.isPinned}
									isRSVPed={userRSVPs.includes(event.id)}
									onDelete={handleDeleteEvent}
									onEdit={handleEditEvent}
									onTogglePin={handleTogglePin}
									onViewAttendees={handleViewAttendees}
									onRSVP={handleRSVP}
									onViewDetails={handleViewDetails}
								/>
							))}
						</motion.div>
					)}
				</div>
			</div>

			<EventDetailsModal
				isOpen={!!viewingEvent}
				onOpenChange={(open) => !open && setViewingEvent(null)}
				event={viewingEvent}
				onRSVP={handleRSVP}
				onViewAttendees={(id) => {
					setViewingEvent(null);
					setSelectedEventId(id);
				}}
				isRSVPed={!!viewingEvent && userRSVPs.includes(viewingEvent.id)}
			/>

			<EventAttendeesModal
				isOpen={!!selectedEventId}
				onClose={() => setSelectedEventId(null)}
				eventId={selectedEventId}
			/>
		</DashboardLayout>
	);
}
