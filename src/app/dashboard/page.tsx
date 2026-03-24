'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { EventCard } from "@/components/dashboard/EventCard";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { UpcomingItem } from "@/components/dashboard/UpcomingItem";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";
import { ProfileCompleteness } from "@/components/dashboard/ProfileCompleteness";
import { NotificationsPanel } from "@/components/dashboard/NotificationsPanel";
import {
	BookOpen,
	Calendar,
	Users,
	Briefcase,
	Brain,
	Heart,
	MessageCircle,
	Car,
	Plus,
	TrendingUp,
	GraduationCap,
	LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function Dashboard() {
	const [firstName, setFirstName] = useState("Student");
	const router = useRouter();

	useEffect(() => {
		const fetchName = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (user) {
				const { data } = await supabase.from('Profile').select('fullName').eq('id', user.id).single();
				if (data?.fullName) {
					setFirstName(data.fullName.split(' ')[0]);
				}
			}
		};
		fetchName();
	}, []);

	const [statsData, setStatsData] = useState({
		activeEvents: 0,
		studyGroups: 0,
		careerScore: 0,
		wellnessStreak: 0
	});

	const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
	const [calendarEventDates, setCalendarEventDates] = useState<string[]>([]);
	const [feedPosts, setFeedPosts] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;

			const { data: profile } = await supabase
				.from('Profile')
				.select('universityId')
				.eq('id', user.id)
				.single();
			const universityId = profile?.universityId;

			// 1. Active Events (Future events in user's university)
			let eventsQuery = supabase
				.from('Event')
				.select('*', { count: 'exact', head: true });
			if (universityId) eventsQuery = eventsQuery.eq('universityId', universityId);
			const { count: eventsCount } = await eventsQuery.gt('date', new Date().toISOString());

				// 2. Study Groups (Club memberships)
				const { count: groupsCount } = await supabase
					.from('ClubMember')
					.select('*', { count: 'exact', head: true })
					.eq('userId', user.id);

				// 3. Career Score (Latest resume)
				const { data: resumeData } = await supabase
					.from('Resume')
					.select('score')
					.eq('userId', user.id)
					.order('createdAt', { ascending: false })
					.limit(1)
					.maybeSingle();

				// 4. Wellness Streak (Mood logs in last 7 days)
				const sevenDaysAgo = new Date();
				sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
				const { count: wellnessCount } = await supabase
					.from('MoodLog')
					.select('*', { count: 'exact', head: true })
					.eq('userId', user.id)
					.gte('loggedAt', sevenDaysAgo.toISOString());

				setStatsData({
					activeEvents: eventsCount || 0,
					studyGroups: groupsCount || 0,
					careerScore: resumeData?.score || 0,
					wellnessStreak: wellnessCount || 0
				});

			// 5. Upcoming Events List
			let upcomingQuery = supabase
				.from('Event')
				.select('*');
			if (universityId) upcomingQuery = upcomingQuery.eq('universityId', universityId);
			const { data: upcomingData } = await upcomingQuery
				.gt('date', new Date().toISOString())
				.order('date', { ascending: true })
				.limit(3);

				if (upcomingData) {
					setCalendarEventDates(upcomingData.map(event => event.date));
					setUpcomingEvents(upcomingData.map(event => {
						const eventDate = new Date(event.date);
						return {
							id: event.id,
							code: "EVENT",
							title: event.title,
							type: event.description?.match(/\[Category: (.*?)\]/)?.[1] || "General",
							date: format(eventDate, "MMM d"),
							time: format(eventDate, "h:mm a"),
							location: event.location || "TBD",
							attendees: 0,
							imageUrl: event.imageUrl || event.image_url || event.imageurl,
							daysLeft: Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
							variant: "mint",
							status: eventDate < new Date() ? "ended" : "upcoming"
						};
					}));
				} else {
					setCalendarEventDates([]);
				}

				// 6. Campus Feed (Recent posts)
				// Note: Join syntax depends on exact relation names. Using author:Profile(...) alias attempt.
				// If it fails, we fall back to just fetching posts.
			let feedQuery = supabase
				.from('Post')
				.select(`
                    content, 
                    createdAt, 
                    scope,
                    Profile!authorId ( fullName )
                `)
				.eq('scope', 'CAMPUS');
			if (universityId) feedQuery = feedQuery.eq('universityId', universityId);
			const { data: feedData } = await feedQuery
				.order('createdAt', { ascending: false })
				.limit(3);

				if (feedData) {
					setFeedPosts(feedData.map(post => {
						// Safe access to profile data
						const authorName = (post.Profile as any)?.fullName || "Unknown User";
						return {
							author: authorName,
							action: "posted update", // Generic action
							content: post.content.length > 50 ? post.content.substring(0, 50) + "..." : post.content,
							time: new Date(post.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
							initials: authorName.split(' ').map((n: any) => n[0]).join('').substring(0, 2)
						};
					}));
				}

			} catch (error) {
				console.error("Error fetching dashboard data:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	const stats = [
		{
			title: "Active Events",
			value: statsData.activeEvents,
			subtitle: "Upcoming on campus",
			icon: Calendar,
			variant: "sky" as const,
			trend: { value: 0, positive: true }, // Placeholder trend
		},
		{
			title: "Study Groups",
			value: statsData.studyGroups,
			subtitle: "Your memberships",
			icon: Users,
			variant: "mint" as const,
			trend: { value: 0, positive: true },
		},
		{
			title: "Career Score",
			value: statsData.careerScore ? `${statsData.careerScore}%` : "N/A",
			subtitle: "Resume strength",
			icon: Briefcase,
			variant: "amber" as const,
			trend: { value: 0, positive: true },
		},
		{
			title: "Wellness Streak",
			value: `${statsData.wellnessStreak} days`,
			subtitle: "Last 7 days",
			icon: Heart,
			variant: "rose" as const,
		},
	];

	const quickActions = [
		{
			title: "Academic AI Assistant",
			description: "Get instant help with doubts, access notes, and study resources",
			icon: Brain,
			variant: "lavender" as const,
			href: "/academic",
		},
		{
			title: "Resume Analyzer",
			description: "Get your resume scored and receive AI-powered improvements",
			icon: GraduationCap,
			variant: "amber" as const,
			href: "/career",
		},
		{
			title: "Anonymous Forums",
			description: "Discuss freely without revealing your identity",
			icon: MessageCircle,
			variant: "mint" as const,
			href: "/forums",
		},
		{
			title: "Cab Pooling",
			description: "Find travel buddies and split costs for your next trip",
			icon: Car,
			variant: "sky" as const,
			href: "/travel",
		},
	];



	return (
		<DashboardLayout
			title={
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
						<LayoutDashboard className="h-6 w-6" />
					</div>
					<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
						Welcome <span className="text-primary truncate max-w-[200px] md:max-w-md inline-block align-bottom">{firstName}</span>!
					</h1>
				</div>
			}
			subtitle="Here's what's happening across your campus ecosystem today."
			breadcrumb={["UniVerse", "Overview"]}
		>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Main Content - 2 columns */}
				<div className="lg:col-span-2 space-y-6">
					{/* Stats Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{stats.map((stat, index) => (
							<StatCard key={index} {...stat} />
						))}
					</div>

					{/* Quick Actions */}
					<section>
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-lg font-semibold text-foreground">
								Quick Actions
							</h2>
						<Button variant="ghost" size="sm" className="text-primary" onClick={() => router.push('/academic')}>
							View all
						</Button>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{quickActions.map((action, index) => (
								<QuickActionCard
									key={index}
									{...action}
									onClick={() => router.push(action.href)}
								/>
							))}
						</div>
					</section>

					{/* Upcoming Events */}
					<section>
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-3">
								<h2 className="text-lg font-semibold text-foreground">
									Upcoming Events
								</h2>
								<Badge variant="secondary" className="text-xs">
									{upcomingEvents.length} this week
								</Badge>
							</div>
						<Button size="sm" className="gap-1.5" onClick={() => router.push('/events')}>
							<Plus className="h-4 w-4" />
							Add Event
						</Button>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{upcomingEvents.length > 0 ? (
								upcomingEvents.map((event, index) => (
									<EventCard key={event.id || index} {...event} />
								))
							) : (
								<div className="col-span-2 text-center text-muted-foreground p-4">No upcoming events found.</div>
							)}
						</div>
					</section>
				</div>

				{/* Right Sidebar - 1 column */}
				<div className="space-y-6">
					{/* Profile Completeness */}
					<ProfileCompleteness />

					{/* Mini Calendar */}
					<MiniCalendar eventDates={calendarEventDates} />

					{/* Upcoming Deadlines */}
					<section className="bg-card rounded-xl border border-border p-4 shadow-card">
						<div className="flex items-center justify-between mb-4">
							<h2 className="font-semibold text-foreground">
								Upcoming Deadlines
							</h2>
						<Button variant="ghost" size="sm" className="text-xs text-primary h-7" onClick={() => router.push('/events')}>
							View all
						</Button>
						</div>
						<div className="space-y-3">
							{upcomingEvents.length > 0 ? (
								upcomingEvents.map((item, index) => (
									<UpcomingItem key={index} {...item} />
								))
							) : (
								<div className="text-sm text-muted-foreground text-center py-2">No upcoming deadlines</div>
							)}
						</div>
					</section>

					{/* Notifications Panel */}
					<NotificationsPanel />

					{/* Campus Feed Preview */}
					<section className="bg-card rounded-xl border border-border p-4 shadow-card">
						<div className="flex items-center justify-between mb-4">
							<h2 className="font-semibold text-foreground">Campus Feed</h2>
							<Badge className="bg-status-success/20 text-status-success text-xs">
								● Live
							</Badge>
						</div>
						<div className="space-y-4">
							{feedPosts.length > 0 ? (
								feedPosts.map((post, index) => (
									<div key={index} className="flex items-start gap-3">
										<div className="w-8 h-8 rounded-full bg-pastel-lavender flex items-center justify-center text-xs font-medium text-pastel-lavender-dark">
											{post.initials}
										</div>
										<div className="flex-1">
											<p className="text-sm">
												<span className="font-medium">{post.author}</span>{" "}
												<span className="text-muted-foreground">
													{post.action}
												</span>
											</p>
											<p className="text-sm text-muted-foreground mt-1">
												"{post.content}"
											</p>
											<p className="text-xs text-muted-foreground/70 mt-1">
												{post.time}
											</p>
										</div>
									</div>
								))
							) : (
								<div className="text-sm text-muted-foreground text-center py-4">No recent activity.</div>
							)}
						</div>
					<Button
						variant="outline"
						className="w-full mt-4 text-sm"
						size="sm"
						onClick={() => router.push('/feed')}
					>
						Open Campus Feed
					</Button>
					</section>
				</div>
			</div>
		</DashboardLayout>
	);
};
