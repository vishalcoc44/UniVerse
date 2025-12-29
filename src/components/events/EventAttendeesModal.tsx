
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
	const [attendees, setAttendees] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (isOpen && eventId) {
			fetchAttendees();
		}
	}, [isOpen, eventId]);

	const fetchAttendees = async () => {
		setLoading(true);
		const { data, error } = await supabase
			.from('EventRSVP')
			.select('*, user:Profile(*)')
			.eq('eventId', eventId)
			.eq('status', 'GOING');

		if (error) {
			console.error("Error fetching attendees:", error);
		} else {
			setAttendees(data?.map(rsvp => rsvp.user) || []);
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
					) : attendees.length === 0 ? (
						<div className="text-center text-muted-foreground p-4">
							No one has RSVP'd yet. Be the first!
						</div>
					) : (
						<div className="space-y-4">
							{attendees.map((user) => (
								<div key={user.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
									<Avatar>
										<AvatarImage src={user.avatarUrl} />
										<AvatarFallback>{user.fullName?.[0] || 'U'}</AvatarFallback>
									</Avatar>
									<div>
										<p className="text-sm font-medium leading-none">{user.fullName}</p>
										<p className="text-xs text-muted-foreground mt-1">
											{user.department || user.role}
										</p>
									</div>
								</div>
							))}
						</div>
					)}
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
