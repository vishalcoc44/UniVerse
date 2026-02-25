
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface EventAttendeesModalProps {
	eventId: string | null;
	isOpen: boolean;
	onClose: () => void;
}

export function EventAttendeesModal({ eventId, isOpen, onClose }: EventAttendeesModalProps) {
	const [attendees, setAttendees] = useState<any[]>([]); // now stores RSVP rows (with user: Profile)
	const [attendeesCount, setAttendeesCount] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [isOrganizer, setIsOrganizer] = useState(false);

	useEffect(() => {
		if (isOpen && eventId) {
			fetchAttendees();
		}
	}, [isOpen, eventId]);

	const fetchAttendees = async () => {
		setLoading(true);

		// get current user
		const { data: { user } } = await supabase.auth.getUser();
		const uid = user?.id || null;
		setCurrentUserId(uid);

		// fetch event organizer to determine visibility
		const { data: ev, error: evErr } = await supabase
			.from('Event')
			.select('organizerId')
			.eq('id', eventId)
			.maybeSingle();

		const organizerId = ev?.organizerId || null;
		const organizer = uid !== null && organizerId !== null && uid === organizerId;
		setIsOrganizer(!!organizer);

		if (organizer) {
			// Organizer can see full RSVP rows (includes timestamp + status + user profile)
			const { data, error } = await supabase
				.from('EventRSVP')
				.select('id, status, createdAt, user:Profile(id, fullName, avatarUrl, department, role)')
				.eq('eventId', eventId)
				.order('createdAt', { ascending: true });

			if (error) {
				console.error("Error fetching attendees:", error);
				setAttendees([]);
			} else {
				setAttendees(data || []);
			}
			setAttendeesCount((data && data.length) || 0);
		} else {
			// Non-organizers only get the count
			const { data, error, count } = await supabase
				.from('EventRSVP')
				.select('id', { count: 'exact' })
				.eq('eventId', eventId)
				.eq('status', 'GOING');

			if (error) {
				console.error('Error fetching attendee count:', error);
				setAttendeesCount(null);
			} else {
				setAttendeesCount(count ?? (data?.length || 0));
			}
			setAttendees([]);
		}

		setLoading(false);
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-xl border-border/50">
				<DialogHeader>
					<DialogTitle>Who's Going?</DialogTitle>
				</DialogHeader>

				<ScrollArea className="h-[300px] pr-4">
					{loading ? (
						<div className="flex justify-center items-center h-full">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : isOrganizer ? (
						attendees.length === 0 ? (
							<div className="text-center text-muted-foreground p-4">
								No one has RSVP'd yet. Be the first!
							</div>
						) : (
							<div className="space-y-4">
								{attendees.map((rsvp) => {
									const user = rsvp.user || {};
									const createdAt = rsvp.createdAt;
									const status = rsvp.status;
									return (
										<div key={rsvp.id} className="flex items-center justify-between gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
											<div className="flex items-center gap-3">
												<Avatar>
													<AvatarImage src={user.avatarUrl} />
													<AvatarFallback>{user.fullName?.[0] || 'U'}</AvatarFallback>
												</Avatar>
												<div>
													<p className="text-sm font-medium leading-none">{user.fullName}</p>
													<p className="text-xs text-muted-foreground mt-1">{user.department || user.role}</p>
												</div>
											</div>
											<div className="text-right ml-4">
												<p className="text-xs text-muted-foreground">{status}</p>
												<p className="text-[11px] text-muted-foreground/80">{createdAt ? new Date(createdAt).toLocaleString() : ''}</p>
											</div>
										</div>
									);
								})}
							</div>
						)
					) : (
						// Non-organizers get a count + generic avatars preview
						<div className="space-y-4">
							<div className="flex items-center gap-3">
								{Array.from({ length: Math.min(attendeesCount ?? 0, 5) }).map((_, i) => (
									<div key={i} className="h-7 w-7 rounded-full border-2 border-card bg-secondary flex items-center justify-center overflow-hidden">
										<img src={`https://i.pravatar.cc/100?u=${eventId}${i}`} alt="avatar" />
									</div>
								))}
								<div className="text-sm text-muted-foreground">
									{attendeesCount ?? 0} {attendeesCount === 1 ? 'person is' : 'people are'} attending
								</div>
							</div>
							<div className="text-xs text-muted-foreground">Only the event organizer can see full participant details.</div>
						</div>
					)}
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
