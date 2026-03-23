'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Bell,
	MessageSquare,
	Calendar,
	Users,
	ShoppingBag,
	Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface NotificationItem {
	id: string;
	type: "message" | "event" | "club" | "marketplace";
	title: string;
	description: string;
	time: Date;
	href: string;
}

const typeConfig = {
	message: {
		icon: MessageSquare,
		color: "bg-blue-500",
		lightBg: "bg-blue-500/10",
		textColor: "text-blue-600 dark:text-blue-400",
	},
	event: {
		icon: Calendar,
		color: "bg-amber-500",
		lightBg: "bg-amber-500/10",
		textColor: "text-amber-600 dark:text-amber-400",
	},
	club: {
		icon: Users,
		color: "bg-violet-500",
		lightBg: "bg-violet-500/10",
		textColor: "text-violet-600 dark:text-violet-400",
	},
	marketplace: {
		icon: ShoppingBag,
		color: "bg-emerald-500",
		lightBg: "bg-emerald-500/10",
		textColor: "text-emerald-600 dark:text-emerald-400",
	},
};

function getRelativeTime(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffMins < 1) return "Just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function NotificationsPanel() {
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const fetchNotifications = async () => {
			try {
				const { data: { user } } = await supabase.auth.getUser();
				if (!user) return;

				const allNotifications: NotificationItem[] = [];

				// 1. Unread messages
				const { data: participants } = await supabase
					.from('ConversationParticipant')
					.select('conversationId')
					.eq('userId', user.id);

				if (participants && participants.length > 0) {
					const conversationIds = participants.map(p => p.conversationId);

					const { data: messages } = await supabase
						.from('Message')
						.select('id, content, senderId, createdAt, readBy, Profile!senderId(fullName)')
						.in('conversationId', conversationIds)
						.neq('senderId', user.id)
						.order('createdAt', { ascending: false })
						.limit(5);

					if (messages) {
						const unread = messages.filter(m => !m.readBy || !m.readBy.includes(user.id));
						unread.slice(0, 2).forEach(msg => {
							const senderName = (msg.Profile as any)?.fullName || "Someone";
							allNotifications.push({
								id: `msg-${msg.id}`,
								type: "message",
								title: "New message",
								description: `${senderName}: ${msg.content?.substring(0, 40) || "Sent a message"}${(msg.content?.length || 0) > 40 ? '...' : ''}`,
								time: new Date(msg.createdAt),
								href: "/messages",
							});
						});
					}
				}

				// 2. Upcoming events (within 3 days)
				const threeDaysFromNow = new Date();
				threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

				const { data: events } = await supabase
					.from('Event')
					.select('id, title, date, location')
					.gt('date', new Date().toISOString())
					.lte('date', threeDaysFromNow.toISOString())
					.order('date', { ascending: true })
					.limit(2);

				if (events) {
					events.forEach(event => {
						const eventDate = new Date(event.date);
						const hoursUntil = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60));
						const timeLabel = hoursUntil < 24
							? `In ${hoursUntil} hours`
							: `In ${Math.ceil(hoursUntil / 24)} days`;

						allNotifications.push({
							id: `event-${event.id}`,
							type: "event",
							title: "Upcoming event",
							description: `${event.title} — ${timeLabel}`,
							time: new Date(event.date),
							href: "/events",
						});
					});
				}

				// 3. Recent club joins (activity)
				const { data: clubActivity } = await supabase
					.from('ClubMember')
					.select('id, joinedAt, Club(name)')
					.eq('userId', user.id)
					.order('joinedAt', { ascending: false })
					.limit(2);

				if (clubActivity) {
					clubActivity.forEach(activity => {
						const clubName = (activity.Club as any)?.name || "a club";
						allNotifications.push({
							id: `club-${activity.id}`,
							type: "club",
							title: "Club membership",
							description: `You're a member of ${clubName}`,
							time: new Date(activity.joinedAt),
							href: "/clubs",
						});
					});
				}

				// 4. Recent marketplace listings
				const { data: listings } = await supabase
					.from('MarketplaceListing')
					.select('id, title, createdAt, price')
					.neq('sellerId', user.id)
					.eq('status', 'ACTIVE')
					.order('createdAt', { ascending: false })
					.limit(2);

				if (listings) {
					listings.forEach(listing => {
						allNotifications.push({
							id: `listing-${listing.id}`,
							type: "marketplace",
							title: "New listing",
							description: `${listing.title} — ₹${listing.price}`,
							time: new Date(listing.createdAt),
							href: "/marketplace",
						});
					});
				}

				// Sort by time descending, take top 5
				allNotifications.sort((a, b) => b.time.getTime() - a.time.getTime());
				setNotifications(allNotifications.slice(0, 5));
			} catch (error) {
				console.error("Error fetching notifications:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchNotifications();
	}, []);

	if (loading) {
		return (
			<section className="bg-card rounded-xl border border-border p-4 shadow-card animate-pulse">
				<div className="h-4 w-28 bg-muted rounded mb-4" />
				<div className="space-y-3">
					{[1, 2, 3].map(i => (
						<div key={i} className="flex items-start gap-3">
							<div className="h-8 w-8 rounded-full bg-muted" />
							<div className="flex-1 space-y-1.5">
								<div className="h-3 bg-muted rounded w-3/4" />
								<div className="h-2.5 bg-muted rounded w-1/2" />
							</div>
						</div>
					))}
				</div>
			</section>
		);
	}

	return (
		<section className="bg-card rounded-xl border border-border p-4 shadow-card">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<h2 className="font-semibold text-foreground">Notifications</h2>
					{notifications.length > 0 && (
						<Badge className="h-5 min-w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] p-0 px-1.5 shadow-sm">
							{notifications.length}
						</Badge>
					)}
				</div>
				<Bell className="h-4 w-4 text-muted-foreground" />
			</div>

			{notifications.length > 0 ? (
				<div className="space-y-1">
					{notifications.map((item) => {
						const config = typeConfig[item.type];
						const Icon = config.icon;

						return (
							<div
								key={item.id}
								onClick={() => router.push(item.href)}
								className="flex items-start gap-3 p-2 -mx-1 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
							>
								{/* Icon dot */}
								<div className={cn(
									"flex items-center justify-center h-8 w-8 rounded-full shrink-0 transition-transform group-hover:scale-105",
									config.lightBg
								)}>
									<Icon className={cn("h-3.5 w-3.5", config.textColor)} />
								</div>

								{/* Content */}
								<div className="flex-1 min-w-0">
									<p className="text-xs font-medium text-foreground leading-tight">
										{item.title}
									</p>
									<p className="text-[11px] text-muted-foreground leading-snug mt-0.5 truncate">
										{item.description}
									</p>
								</div>

								{/* Time */}
								<div className="flex items-center gap-1 shrink-0 pt-0.5">
									<Clock className="h-2.5 w-2.5 text-muted-foreground/50" />
									<span className="text-[10px] text-muted-foreground/70 whitespace-nowrap">
										{getRelativeTime(item.time)}
									</span>
								</div>
							</div>
						);
					})}
				</div>
			) : (
				<div className="text-center py-6">
					<div className="flex justify-center mb-2">
						<div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
							<Bell className="h-5 w-5 text-muted-foreground/40" />
						</div>
					</div>
					<p className="text-sm text-muted-foreground">All caught up!</p>
					<p className="text-xs text-muted-foreground/60 mt-0.5">No new notifications</p>
				</div>
			)}

			{notifications.length > 0 && (
				<Button
					variant="outline"
					className="w-full mt-3 text-xs h-8"
					size="sm"
					onClick={() => router.push('/messages')}
				>
					View All Activity
				</Button>
			)}
		</section>
	);
}
