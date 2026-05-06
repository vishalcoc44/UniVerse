"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
	BarChart3,
	Users,
	MousePointerClick,
	Eye,
	Loader2,
	Activity,
	Zap,
	Flame,
	RefreshCw,
	Calendar,
	TrendingUp,
	Clock,
	CalendarDays,
	Compass,
	Sparkles,
	Smartphone,
	Monitor,
	Trophy,
	Hash,
	Download,
} from "lucide-react";
import {
	Line,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
	Area,
	AreaChart,
	PieChart,
	Pie,
	Cell,
	Legend,
} from "recharts";
import { formatDistanceToNow } from "date-fns";

interface DailyPoint {
	day: string;
	views: number;
	uniqueUsers: number;
	events: number;
}

interface PathRow {
	path: string;
	views: number;
}

interface EventRow {
	eventName: string;
	count: number;
}

interface RecentRow {
	id: string;
	eventName: string;
	userId: string | null;
	createdAt: string;
	path: string | null;
}

interface HourPoint {
	hour: string;   // "00".."23"
	count: number;
}
interface DowPoint {
	day: string;    // "Mon".."Sun"
	count: number;
}
interface FeatureSlice {
	name: string;
	value: number;
}
interface UserRow {
	userId: string;
	count: number;
}

const RANGE_DAYS = 30;
const ROW_CAP = 50000;

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FEATURE_COLORS = [
	"#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444",
	"#ec4899", "#14b8a6", "#6366f1", "#a855f7", "#84cc16",
	"#f97316", "#06b6d4", "#facc15",
];

// Map the first path segment to a friendly feature name
function pathToFeature(path: string): string {
	if (!path || path === "/") return "Landing";
	const seg = path.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
	const map: Record<string, string> = {
		feed: "Social Feed",
		forums: "Forums",
		messages: "Messages",
		academic: "Academic / AI",
		career: "Career",
		marketplace: "Marketplace",
		events: "Events",
		clubs: "Clubs",
		travel: "Travel",
		wellness: "Wellness",
		research: "Research",
		utilities: "Utilities",
		news: "News",
		admin: "Admin",
		settings: "Settings",
		profile: "Profile",
		dashboard: "Dashboard",
		auth: "Auth",
		signup: "Auth",
		"request-university": "Auth",
		updates: "Updates",
		departments: "Departments",
	};
	return map[seg] ?? "Other";
}

function isMobileUA(ua: string): boolean {
	return /Mobile|Android|iPhone|iPad|iPod/i.test(ua);
}

function pctChange(current: number, prev: number): { value: number; positive: boolean } {
	if (prev === 0) return { value: current > 0 ? 100 : 0, positive: current >= 0 };
	const delta = ((current - prev) / prev) * 100;
	return { value: Math.abs(Math.round(delta)), positive: delta >= 0 };
}

// Friendly labels for the most common event names
const EVENT_LABELS: Record<string, string> = {
	login: "🔐 Logged in",
	logout: "👋 Logged out",
	signup: "🎓 New signup",
	create_post: "📝 Posted to feed",
	create_forum_thread: "💬 Started a thread",
	create_forum_reply: "↪️ Replied to a thread",
	comment_post: "💭 Commented",
	like_post: "❤️ Liked a post",
	bookmark_post: "🔖 Bookmarked a post",
	react_to_post: "😀 Reacted",
	send_message: "📨 Sent a message",
	start_direct_conversation: "💬 Started a chat",
	create_group_chat: "👥 Created a group chat",
	send_study_group_message: "📣 Posted in a study circle",
	ai_chat_message: "🤖 Used the AI tutor",
	generate_flashcards: "🎴 Generated flashcards",
	generate_quiz: "❓ Generated a quiz",
	complete_quiz_attempt: "✅ Finished a quiz",
	generate_study_plan: "🗓️ Built a study plan",
	complete_study_session: "✔️ Completed a session",
	ai_summarize_note: "📋 AI-summarized a note",
	ai_explain_concept: "💡 AI-explained a concept",
	save_note: "💾 Saved a note",
	upload_resource: "📎 Uploaded a resource",
	upvote_resource: "👍 Upvoted a resource",
	create_course: "📘 Added a course",
	create_study_group: "🎯 Created a study circle",
	join_study_group: "➕ Joined a study circle",
	resume_analyzed: "📄 Analyzed a resume",
	save_job: "💼 Saved a job",
	apply_to_job: "🚀 Applied to a job",
	mock_interview_evaluated: "🎤 Did a mock interview",
	submit_salary_report: "💰 Reported salary",
	submit_company_review: "⭐ Reviewed a company",
	create_marketplace_listing: "🏪 Listed an item",
	delete_marketplace_listing: "🗑️ Removed a listing",
	create_lost_found: "🔍 Lost & found post",
	create_event: "📅 Created an event",
	rsvp_event: "✅ RSVP'd",
	cancel_rsvp: "❌ Cancelled RSVP",
	create_club: "🏛️ Created a club",
	apply_to_club: "📝 Applied to a club",
	leave_club: "🚪 Left a club",
	create_ride_offer: "🚗 Offered a ride",
	request_ride_seat: "🙋 Requested a seat",
	log_mood: "🌱 Logged mood",
	send_friend_request: "🤝 Friend request sent",
	accept_friend_request: "🎉 Friend request accepted",
	remove_friendship: "👋 Removed a friend",
	update_profile: "✏️ Updated profile",
	upload_avatar: "🖼️ Updated avatar",
	request_university: "🏫 Requested a university",
	create_research_project: "🔬 New research project",
	invite_research_collaborator: "🤝 Invited a collaborator",
	publish_news: "📰 Published news",
	admin_review_university: "👨‍⚖️ Reviewed a university",
	admin_dismiss_report: "✋ Dismissed a report",
	admin_remove_content: "🚮 Removed content",
	submit_feedback: "📬 Sent feedback",
	vote_post_poll: "🗳️ Voted on a poll",
	vote_forum_thread: "👍 Voted on a thread",
	vote_forum_reply: "👍 Voted on a reply",
	vote_forum_poll: "🗳️ Voted on a forum poll",
	bookmark_thread: "🔖 Bookmarked a thread",
	report_forum_content: "🚩 Reported content",
	repost: "🔁 Reposted",
	react_to_message: "😀 Reacted to a message",
};

function labelEvent(name: string): string {
	return EVENT_LABELS[name] ?? name.replace(/_/g, " ");
}

// Generate friendly analytics export text
function generateAnalyticsExport(
	totals: any,
	daily: DailyPoint[],
	topPaths: PathRow[],
	topEvents: EventRow[],
	topUsers: UserRow[],
	features: FeatureSlice[],
	deviceSplit: { mobile: number; desktop: number },
	hottestEvent: { name: string; count: number } | null,
	aiSpotlight: EventRow[],
	dow: DowPoint[]
): string {
	const now = new Date().toLocaleString();
	const totalDevices = deviceSplit.mobile + deviceSplit.desktop;
	const mobilePct = totalDevices > 0 ? Math.round((deviceSplit.mobile / totalDevices) * 100) : 0;

	let txt = `📊 UNIVERSE ANALYTICS REPORT\n`;
	txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
	txt += `Generated: ${now}\n`;
	txt += `Period: Last ${RANGE_DAYS} days\n\n`;

	// 🎯 KEY METRICS
	txt += `🎯 KEY METRICS (Last ${RANGE_DAYS} Days)\n`;
	txt += `──────────────────────────────────\n`;
	txt += `📍 Page Views:        ${totals.pageViews.toLocaleString()} ${totals.viewsTrend.positive ? '📈' : '📉'} (${totals.viewsTrend.value}%)\n`;
	txt += `⚡ Tracked Events:    ${totals.events.toLocaleString()} ${totals.eventsTrend.positive ? '📈' : '📉'} (${totals.eventsTrend.value}%)\n`;
	txt += `👥 Unique Users:      ${totals.uniqueUsers.toLocaleString()} ${totals.usersTrend.positive ? '📈' : '📉'} (${totals.usersTrend.value}%)\n`;
	txt += `💬 Engagement Rate:   ${totals.engagementRate}% ${totals.engagementTrend.positive ? '📈' : '📉'} (${totals.engagementTrend.value}%)\n\n`;

	// 👤 USER ACTIVITY
	txt += `👤 USER ACTIVITY\n`;
	txt += `──────────────────────────────────\n`;
	txt += `🌅 Daily Active Users (DAU):   ${totals.dau.toLocaleString()}\n`;
	txt += `📅 Weekly Active Users (WAU):  ${totals.wau.toLocaleString()}\n`;
	txt += `📊 Sessions:                    ${totals.sessions.toLocaleString()}\n`;
	txt += `⚙️ Events per Session:          ${totals.avgEventsPerSession.toFixed(1)}\n\n`;

	// 🔥 RIGHT NOW
	txt += `🔥 RIGHT NOW\n`;
	txt += `──────────────────────────────────\n`;
	txt += `🌞 Active Today:                ${totals.dau.toLocaleString()}\n`;
	txt += `👁️ Page Views Today:            ${totals.todayViews.toLocaleString()}\n`;
	txt += `⚡ Events Today:                ${totals.todayEvents.toLocaleString()}\n`;
	txt += `🔥 Events This Week:            ${totals.weekEvents.toLocaleString()}\n\n`;

	// 🏆 TRENDING NOW
	if (hottestEvent) {
		txt += `🏆 TRENDING NOW\n`;
		txt += `──────────────────────────────────\n`;
		txt += `${labelEvent(hottestEvent.name)}\n`;
		txt += `Fired ${hottestEvent.count} times in the last hour\n\n`;
	}

	// 📱 DEVICE BREAKDOWN
	txt += `📱 DEVICE SPLIT\n`;
	txt += `──────────────────────────────────\n`;
	txt += `💻 Desktop:  ${deviceSplit.desktop.toLocaleString()} sessions (${100 - mobilePct}%)\n`;
	txt += `📱 Mobile:   ${deviceSplit.mobile.toLocaleString()} sessions (${mobilePct}%)\n\n`;

	// 📅 BUSIEST DAYS
	txt += `📅 BUSIEST DAYS OF THE WEEK\n`;
	txt += `──────────────────────────────────\n`;
	const sortedDow = [...dow].sort((a, b) => b.count - a.count);
	sortedDow.slice(0, 3).forEach((d, i) => {
		txt += `${i + 1}. ${d.day.padEnd(10)} ${d.count.toLocaleString().padStart(8)} activities\n`;
	});
	txt += `\n`;

	// 🎯 TOP PAGES
	txt += `🎯 TOP PAGES (${topPaths.length})\n`;
	txt += `──────────────────────────────────\n`;
	topPaths.slice(0, 5).forEach((row, i) => {
		const pct = ((row.views / totals.pageViews) * 100).toFixed(1);
		txt += `${i + 1}. ${row.path.padEnd(28)} ${row.views.toLocaleString().padStart(6)} views (${pct}%)\n`;
	});
	txt += `\n`;

	// ✨ TOP FEATURES
	txt += `✨ MOST-USED FEATURES\n`;
	txt += `──────────────────────────────────\n`;
	features.slice(0, 5).forEach((f, i) => {
		txt += `${i + 1}. ${f.name.padEnd(30)} ${f.value.toLocaleString().padStart(6)} visits\n`;
	});
	txt += `\n`;

	// ⚡ TOP ACTIONS
	txt += `⚡ TOP ACTIONS\n`;
	txt += `──────────────────────────────────\n`;
	topEvents.slice(0, 8).forEach((evt, i) => {
		const friendlyName = labelEvent(evt.eventName);
		const pct = ((evt.count / totals.events) * 100).toFixed(1);
		txt += `${i + 1}. ${friendlyName.padEnd(40)} ${evt.count.toLocaleString().padStart(6)} (${pct}%)\n`;
	});
	txt += `\n`;

	// 🤖 AI USAGE
	if (aiSpotlight.length > 0) {
		txt += `🤖 AI USAGE\n`;
		txt += `──────────────────────────────────\n`;
		aiSpotlight.forEach((evt, i) => {
			const friendlyName = labelEvent(evt.eventName);
			txt += `${i + 1}. ${friendlyName.padEnd(35)} ${evt.count.toLocaleString().padStart(6)} uses\n`;
		});
		txt += `\n`;
	}

	// 🏅 TOP USERS
	if (topUsers.length > 0) {
		txt += `🏅 TOP USERS (by event count)\n`;
		txt += `──────────────────────────────────\n`;
		topUsers.forEach((user, i) => {
			const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
			txt += `${medal} ${user.userId.slice(0, 12).padEnd(14)} ${user.count.toLocaleString().padStart(6)} events\n`;
		});
		txt += `\n`;
	}

	// 📈 DAILY TREND (summary)
	txt += `📈 ACTIVITY TREND (Last 7 Days)\n`;
	txt += `──────────────────────────────────\n`;
	const last7Days = daily.slice(-7);
	last7Days.forEach((day) => {
		const barLength = Math.ceil((day.views / 50));
		const bar = '█'.repeat(Math.min(barLength, 30));
		txt += `${day.day} ${bar} ${day.views.toLocaleString()} views, ${day.events.toLocaleString()} events\n`;
	});
	txt += `\n`;

	// Footer
	txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
	txt += `✨ End of Report\n`;
	txt += `💡 For detailed breakdowns, visit the Analytics Dashboard\n`;

	return txt;
}

// Postgres `timestamp without time zone` columns return an ISO string with no
// trailing 'Z', which JavaScript wrongly parses as local time. Server stores
// UTC, so we coerce by appending 'Z' before parsing.
function parseUTC(s: string): Date {
	if (!s) return new Date();
	const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(s);
	return new Date(hasTz ? s : s + "Z");
}

export default function AnalyticsDashboard() {
	const router = useRouter();
	const [authChecked, setAuthChecked] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);

	const [totals, setTotals] = useState({
		pageViews: 0,
		events: 0,
		uniqueUsers: 0,
		engagementRate: 0,
		dau: 0,
		wau: 0,
		todayViews: 0,
		todayEvents: 0,
		weekEvents: 0,
		sessions: 0,
		avgEventsPerSession: 0,
		// Trend deltas
		viewsTrend: { value: 0, positive: true },
		eventsTrend: { value: 0, positive: true },
		usersTrend: { value: 0, positive: true },
		engagementTrend: { value: 0, positive: true },
	});
	const [daily, setDaily] = useState<DailyPoint[]>([]);
	const [topPaths, setTopPaths] = useState<PathRow[]>([]);
	const [topEvents, setTopEvents] = useState<EventRow[]>([]);
	const [recent, setRecent] = useState<RecentRow[]>([]);
	const [hottestEvent, setHottestEvent] = useState<{ name: string; count: number } | null>(null);
	const [hourly, setHourly] = useState<HourPoint[]>([]);
	const [dow, setDow] = useState<DowPoint[]>([]);
	const [features, setFeatures] = useState<FeatureSlice[]>([]);
	const [topUsers, setTopUsers] = useState<UserRow[]>([]);
	const [deviceSplit, setDeviceSplit] = useState({ mobile: 0, desktop: 0 });
	const [aiSpotlight, setAiSpotlight] = useState<EventRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	// Auth gate — platform admin only
	useEffect(() => {
		(async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				router.replace("/auth");
				return;
			}
			const { data: profile } = await supabase
				.from("Profile")
				.select("role, universityId")
				.eq("id", user.id)
				.single();
			const allowed = profile?.role === "ADMIN" && !profile?.universityId;
			if (!allowed) {
				toast.error("Platform admin access required");
				router.replace("/dashboard");
				return;
			}
			setIsAdmin(true);
			setAuthChecked(true);
		})();
	}, [router]);

	const loadData = async () => {
		const dayMs = 86400_000;
		const now = Date.now();
		const since = new Date(now - RANGE_DAYS * dayMs).toISOString();
		const prevSince = new Date(now - 2 * RANGE_DAYS * dayMs).toISOString();
		const prevUntil = since; // [-60d, -30d)

		const [
			{ data: views },
			{ data: events },
			{ count: prevViewCount },
			{ count: prevEventCount },
			{ data: prevUserSample },
		] = await Promise.all([
			supabase
				.from("Analytics_PageView")
				.select("path, userId, sessionId, userAgent, createdAt")
				.gte("createdAt", since)
				.order("createdAt", { ascending: false })
				.limit(ROW_CAP),
			supabase
				.from("Analytics_Event")
				.select("id, eventName, userId, createdAt, path")
				.gte("createdAt", since)
				.order("createdAt", { ascending: false })
				.limit(ROW_CAP),
			supabase
				.from("Analytics_PageView")
				.select("*", { count: "exact", head: true })
				.gte("createdAt", prevSince)
				.lt("createdAt", prevUntil),
			supabase
				.from("Analytics_Event")
				.select("*", { count: "exact", head: true })
				.gte("createdAt", prevSince)
				.lt("createdAt", prevUntil),
			supabase
				.from("Analytics_PageView")
				.select("userId")
				.gte("createdAt", prevSince)
				.lt("createdAt", prevUntil)
				.not("userId", "is", null)
				.limit(ROW_CAP),
		]);

		const v = views ?? [];
		const e = events ?? [];

		// Unique users (anywhere in window)
		const allUserIds = new Set<string>();
		v.forEach((row) => row.userId && allUserIds.add(row.userId));
		e.forEach((row) => row.userId && allUserIds.add(row.userId));

		// DAU / WAU / Today / Week
		const dauSet = new Set<string>();
		const wauSet = new Set<string>();
		let todayViews = 0;
		let todayEvents = 0;
		let weekEvents = 0;

		v.forEach((row) => {
			const ts = parseUTC(row.createdAt).getTime();
			if (now - ts <= dayMs) {
				todayViews++;
				if (row.userId) dauSet.add(row.userId);
			}
			if (now - ts <= 7 * dayMs && row.userId) wauSet.add(row.userId);
		});

		e.forEach((row) => {
			const ts = parseUTC(row.createdAt).getTime();
			if (now - ts <= dayMs) {
				todayEvents++;
				if (row.userId) dauSet.add(row.userId);
			}
			if (now - ts <= 7 * dayMs) {
				weekEvents++;
				if (row.userId) wauSet.add(row.userId);
			}
		});

		const engagementRate = v.length > 0 ? Math.round((e.length / v.length) * 100) : 0;

		// Sessions + avg/session
		const sessionSet = new Set<string>();
		v.forEach((row) => row.sessionId && sessionSet.add(row.sessionId));
		const sessions = sessionSet.size;
		const avgEventsPerSession = sessions > 0 ? Math.round((e.length / sessions) * 10) / 10 : 0;

		// Trends — current 30d vs previous 30d
		const prevUserSet = new Set<string>();
		(prevUserSample ?? []).forEach((r: any) => r.userId && prevUserSet.add(r.userId));
		const prevEngagement =
			(prevViewCount ?? 0) > 0 ? Math.round(((prevEventCount ?? 0) / (prevViewCount ?? 1)) * 100) : 0;

		setTotals({
			pageViews: v.length,
			events: e.length,
			uniqueUsers: allUserIds.size,
			engagementRate,
			dau: dauSet.size,
			wau: wauSet.size,
			todayViews,
			todayEvents,
			weekEvents,
			sessions,
			avgEventsPerSession,
			viewsTrend: pctChange(v.length, prevViewCount ?? 0),
			eventsTrend: pctChange(e.length, prevEventCount ?? 0),
			usersTrend: pctChange(allUserIds.size, prevUserSet.size),
			engagementTrend: pctChange(engagementRate, prevEngagement),
		});

		// Daily series — initialize all days first so the chart never has gaps
		const byDay = new Map<string, { views: number; users: Set<string>; events: number }>();
		for (let i = RANGE_DAYS - 1; i >= 0; i--) {
			const day = new Date(now - i * dayMs).toISOString().slice(0, 10);
			byDay.set(day, { views: 0, users: new Set(), events: 0 });
		}
		v.forEach((row) => {
			const day = parseUTC(row.createdAt).toISOString().slice(0, 10);
			const slot = byDay.get(day);
			if (!slot) return;
			slot.views++;
			if (row.userId) slot.users.add(row.userId);
		});
		e.forEach((row) => {
			const day = parseUTC(row.createdAt).toISOString().slice(0, 10);
			const slot = byDay.get(day);
			if (!slot) return;
			slot.events++;
		});
		setDaily(
			Array.from(byDay.entries()).map(([day, slot]) => ({
				day: day.slice(5), // MM-DD
				views: slot.views,
				uniqueUsers: slot.users.size,
				events: slot.events,
			}))
		);

		// Top paths
		const pathCounts = new Map<string, number>();
		v.forEach((row) => pathCounts.set(row.path, (pathCounts.get(row.path) ?? 0) + 1));
		setTopPaths(
			Array.from(pathCounts.entries())
				.sort((a, b) => b[1] - a[1])
				.slice(0, 8)
				.map(([path, views]) => ({ path, views }))
		);

		// Top events
		const eventCounts = new Map<string, number>();
		e.forEach((row) => eventCounts.set(row.eventName, (eventCounts.get(row.eventName) ?? 0) + 1));
		const topEventsArr = Array.from(eventCounts.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 8)
			.map(([eventName, count]) => ({ eventName, count }));
		setTopEvents(topEventsArr);

		// Recent activity feed (last 20 events)
		setRecent(
			e.slice(0, 20).map((row) => ({
				id: row.id,
				eventName: row.eventName,
				userId: row.userId,
				createdAt: row.createdAt,
				path: row.path,
			}))
		);

		// Trending: most-fired event in the last hour
		const hourMs = 60 * 60 * 1000;
		const hourCountsTrending = new Map<string, number>();
		e.forEach((row) => {
			if (now - parseUTC(row.createdAt).getTime() <= hourMs) {
				hourCountsTrending.set(row.eventName, (hourCountsTrending.get(row.eventName) ?? 0) + 1);
			}
		});
		const top = Array.from(hourCountsTrending.entries()).sort((a, b) => b[1] - a[1])[0];
		setHottestEvent(top ? { name: top[0], count: top[1] } : null);

		// Hour-of-day: aggregate views + events by 0-23
		const hourBuckets = new Array(24).fill(0);
		v.forEach((row) => {
			hourBuckets[parseUTC(row.createdAt).getHours()]++;
		});
		e.forEach((row) => {
			hourBuckets[parseUTC(row.createdAt).getHours()]++;
		});
		setHourly(
			hourBuckets.map((count, h) => ({
				hour: String(h).padStart(2, "0"),
				count,
			}))
		);

		// Day-of-week: aggregate by weekday
		const dowBuckets = new Array(7).fill(0);
		v.forEach((row) => {
			dowBuckets[parseUTC(row.createdAt).getDay()]++;
		});
		e.forEach((row) => {
			dowBuckets[parseUTC(row.createdAt).getDay()]++;
		});
		// Reorder to start Monday
		const dowOrdered = [1, 2, 3, 4, 5, 6, 0].map((idx) => ({
			day: DOW_LABELS[idx],
			count: dowBuckets[idx],
		}));
		setDow(dowOrdered);

		// Feature usage from path → feature mapping (page views only)
		const featureCounts = new Map<string, number>();
		v.forEach((row) => {
			const f = pathToFeature(row.path);
			featureCounts.set(f, (featureCounts.get(f) ?? 0) + 1);
		});
		setFeatures(
			Array.from(featureCounts.entries())
				.sort((a, b) => b[1] - a[1])
				.map(([name, value]) => ({ name, value }))
		);

		// Top users (by events fired)
		const userCounts = new Map<string, number>();
		e.forEach((row) => {
			if (!row.userId) return;
			userCounts.set(row.userId, (userCounts.get(row.userId) ?? 0) + 1);
		});
		setTopUsers(
			Array.from(userCounts.entries())
				.sort((a, b) => b[1] - a[1])
				.slice(0, 5)
				.map(([userId, count]) => ({ userId, count }))
		);

		// Device split — count distinct sessions, classify by first UA seen per session
		const sessionDevice = new Map<string, "mobile" | "desktop">();
		v.forEach((row) => {
			if (!row.sessionId || sessionDevice.has(row.sessionId)) return;
			const ua = row.userAgent ?? "";
			sessionDevice.set(row.sessionId, isMobileUA(ua) ? "mobile" : "desktop");
		});
		let mobile = 0, desktop = 0;
		sessionDevice.forEach((kind) => {
			if (kind === "mobile") mobile++;
			else desktop++;
		});
		setDeviceSplit({ mobile, desktop });

		// AI spotlight — events that involve AI features
		const aiEventNames = new Set([
			"ai_chat_message",
			"generate_flashcards",
			"generate_quiz",
			"complete_quiz_attempt",
			"generate_study_plan",
			"ai_summarize_note",
			"ai_explain_concept",
			"resume_analyzed",
			"mock_interview_evaluated",
		]);
		const aiCounts = new Map<string, number>();
		e.forEach((row) => {
			if (aiEventNames.has(row.eventName)) {
				aiCounts.set(row.eventName, (aiCounts.get(row.eventName) ?? 0) + 1);
			}
		});
		setAiSpotlight(
			Array.from(aiCounts.entries())
				.sort((a, b) => b[1] - a[1])
				.map(([eventName, count]) => ({ eventName, count }))
		);
	};

	useEffect(() => {
		if (!isAdmin) return;
		(async () => {
			setLoading(true);
			await loadData();
			setLoading(false);
		})();
	}, [isAdmin]);

	const handleRefresh = async () => {
		setRefreshing(true);
		await loadData();
		setRefreshing(false);
		toast.success("Stats refreshed");
	};

	const handleExportAnalytics = () => {
		const text = generateAnalyticsExport(
			totals,
			daily,
			topPaths,
			topEvents,
			topUsers,
			features,
			deviceSplit,
			hottestEvent,
			aiSpotlight,
			dow
		);

		// Create blob and download
		const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `analytics-${new Date().toISOString().slice(0, 10)}.txt`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		toast.success("Analytics exported as text file");
	};

	// Format a path for display (truncate if too long)
	const formatPath = (p: string) => (p.length > 36 ? p.slice(0, 33) + "…" : p);

	if (!authChecked) {
		return (
			<DashboardLayout icon={BarChart3} title="Analytics" breadcrumb={["UniVerse", "Admin", "Analytics"]}>
				<div className="flex flex-col items-center justify-center py-32 gap-4">
					<Loader2 className="h-10 w-10 animate-spin text-primary/40" />
					<p className="text-xs font-black italic tracking-widest text-muted-foreground uppercase">Verifying access...</p>
				</div>
			</DashboardLayout>
		);
	}
	if (!isAdmin) return null;

	const stats = [
		{
			title: "Page Views",
			value: totals.pageViews.toLocaleString(),
			subtitle: `${totals.todayViews.toLocaleString()} today`,
			icon: Eye,
			variant: "sky" as const,
			trend: totals.viewsTrend,
		},
		{
			title: "Tracked Events",
			value: totals.events.toLocaleString(),
			subtitle: `${totals.weekEvents.toLocaleString()} this week`,
			icon: MousePointerClick,
			variant: "lavender" as const,
			trend: totals.eventsTrend,
		},
		{
			title: "Unique Users",
			value: totals.uniqueUsers.toLocaleString(),
			subtitle: `${RANGE_DAYS}-day reach`,
			icon: Users,
			variant: "mint" as const,
			trend: totals.usersTrend,
		},
		{
			title: "Engagement Rate",
			value: `${totals.engagementRate}%`,
			subtitle: "Events per page view",
			icon: TrendingUp,
			variant: "amber" as const,
			trend: totals.engagementTrend,
		},
	];

	const totalDevices = deviceSplit.mobile + deviceSplit.desktop;
	const mobilePct = totalDevices > 0 ? Math.round((deviceSplit.mobile / totalDevices) * 100) : 0;
	const desktopPct = 100 - mobilePct;

	return (
		<DashboardLayout
			title={<>Analytics <span className="text-primary">Dashboard</span></>}
			icon={BarChart3}
			subtitle={`Real-time usage data — last ${RANGE_DAYS} days`}
			breadcrumb={["UniVerse", "Admin", "Analytics"]}
		>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Main column (2/3) */}
				<div className="lg:col-span-2 space-y-6">
					{/* Stats Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{stats.map((stat, i) => (
							<StatCard key={i} {...stat} />
						))}
					</div>

					{/* Controls - Export & Refresh */}
					<div className="flex items-center justify-end gap-2">
						<Button 
							variant="outline" 
							size="sm" 
							onClick={handleExportAnalytics} 
							disabled={loading}
							className="gap-1.5"
						>
							<Download className="h-4 w-4" />
							Export as Text
						</Button>
						<Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-1.5">
							<RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
							Refresh
						</Button>
					</div>

					{/* Activity Over Time */}
					<section className="bg-card rounded-xl border border-border p-5 shadow-card">
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-3">
								<h2 className="text-lg font-semibold text-foreground">Activity Over Time</h2>
								<Badge variant="secondary" className="text-xs">last {RANGE_DAYS} days</Badge>
							</div>
						</div>
						{loading ? (
							<SkeletonChart />
						) : daily.every((d) => d.views === 0 && d.events === 0) ? (
							<EmptyState
								icon={Calendar}
								message="No activity yet. Once users start clicking around, this chart will populate."
							/>
						) : (
							<div className="h-72">
								<ResponsiveContainer width="100%" height="100%">
									<AreaChart data={daily}>
										<defs>
											<linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
												<stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
											</linearGradient>
											<linearGradient id="eventsGrad" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
												<stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
											</linearGradient>
										</defs>
										<CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
										<XAxis dataKey="day" stroke="rgba(148,163,184,0.6)" fontSize={11} />
										<YAxis stroke="rgba(148,163,184,0.6)" fontSize={11} allowDecimals={false} />
										<Tooltip
											contentStyle={{
												background: "white",
												border: "1px solid rgba(148,163,184,0.3)",
												borderRadius: 8,
												fontSize: 12, color: "#0f172a", boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
											}}
										/>
										<Area type="monotone" dataKey="views" stroke="#0ea5e9" strokeWidth={2} fill="url(#viewsGrad)" name="Views" />
										<Area type="monotone" dataKey="events" stroke="#8b5cf6" strokeWidth={2} fill="url(#eventsGrad)" name="Events" />
										<Line type="monotone" dataKey="uniqueUsers" stroke="#10b981" strokeWidth={2} dot={false} name="Users" />
									</AreaChart>
								</ResponsiveContainer>
							</div>
						)}
					</section>

					{/* When Users Are Active — Hour of day + Day of week */}
					<section className="bg-card rounded-xl border border-border p-5 shadow-card">
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-3">
								<h2 className="text-lg font-semibold text-foreground">When Users Are Active</h2>
								<Badge variant="secondary" className="text-xs">last {RANGE_DAYS} days</Badge>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{/* Hour of day */}
							<div className="md:col-span-2">
								<div className="flex items-center gap-1.5 mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
									<Clock className="h-3 w-3" />
									Hour of Day (local)
								</div>
								{loading ? (
									<SkeletonChart h="h-44" />
								) : hourly.every((h) => h.count === 0) ? (
									<EmptyState icon={Clock} message="No data yet." compact />
								) : (
									<div className="h-44">
										<ResponsiveContainer width="100%" height="100%">
											<BarChart data={hourly}>
												<CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
												<XAxis dataKey="hour" stroke="rgba(148,163,184,0.6)" fontSize={10} />
												<YAxis stroke="rgba(148,163,184,0.6)" fontSize={10} allowDecimals={false} />
												<Tooltip
													contentStyle={{
														background: "white",
														border: "1px solid rgba(148,163,184,0.3)",
														borderRadius: 8,
														fontSize: 12, color: "#0f172a", boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
													}}
													labelFormatter={(v) => `${v}:00`}
												/>
												<Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
											</BarChart>
										</ResponsiveContainer>
									</div>
								)}
							</div>

							{/* Day of week */}
							<div>
								<div className="flex items-center gap-1.5 mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
									<CalendarDays className="h-3 w-3" />
									Day of Week
								</div>
								{loading ? (
									<SkeletonChart h="h-44" />
								) : dow.every((d) => d.count === 0) ? (
									<EmptyState icon={CalendarDays} message="No data yet." compact />
								) : (
									<div className="h-44">
										<ResponsiveContainer width="100%" height="100%">
											<BarChart data={dow}>
												<CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
												<XAxis dataKey="day" stroke="rgba(148,163,184,0.6)" fontSize={10} />
												<YAxis stroke="rgba(148,163,184,0.6)" fontSize={10} allowDecimals={false} />
												<Tooltip
													contentStyle={{
														background: "white",
														border: "1px solid rgba(148,163,184,0.3)",
														borderRadius: 8,
														fontSize: 12, color: "#0f172a", boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
													}}
												/>
												<Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
											</BarChart>
										</ResponsiveContainer>
									</div>
								)}
							</div>
						</div>
					</section>

					{/* Feature Usage + AI Spotlight */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Feature Usage donut */}
						<section className="bg-card rounded-xl border border-border p-5 shadow-card">
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-2">
									<Compass className="h-4 w-4 text-primary" />
									<h2 className="font-semibold text-foreground">Feature Usage</h2>
								</div>
								<Badge variant="secondary" className="text-xs">{features.length} areas</Badge>
							</div>
							{loading ? (
								<SkeletonChart h="h-56" />
							) : features.length === 0 ? (
								<EmptyState icon={Compass} message="No views yet." compact />
							) : (
								<div className="h-56">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={features}
												dataKey="value"
												nameKey="name"
												cx="50%"
												cy="50%"
												innerRadius={45}
												outerRadius={80}
												paddingAngle={2}
											>
												{features.map((_, i) => (
													<Cell key={i} fill={FEATURE_COLORS[i % FEATURE_COLORS.length]} />
												))}
											</Pie>
											<Tooltip
												contentStyle={{
													background: "white",
													border: "1px solid rgba(148,163,184,0.3)",
													borderRadius: 8,
													fontSize: 12, color: "#0f172a", boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
												}}
											/>
											<Legend
												verticalAlign="middle"
												align="right"
												layout="vertical"
												iconType="circle"
												wrapperStyle={{ fontSize: 11, paddingLeft: 8 }}
											/>
										</PieChart>
									</ResponsiveContainer>
								</div>
							)}
						</section>

						{/* AI Spotlight */}
						<section className="bg-card rounded-xl border border-border p-5 shadow-card">
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-2">
									<Sparkles className="h-4 w-4 text-violet-500" />
									<h2 className="font-semibold text-foreground">AI Spotlight</h2>
								</div>
								<Badge variant="secondary" className="text-xs">
									{aiSpotlight.reduce((s, x) => s + x.count, 0).toLocaleString()} fired
								</Badge>
							</div>
							{loading ? (
								<SkeletonRows rows={6} />
							) : aiSpotlight.length === 0 ? (
								<EmptyState
									icon={Sparkles}
									message="No AI features used yet. Try the AI tutor, flashcards, or resume analyzer."
									compact
								/>
							) : (
								<div className="space-y-2">
									{aiSpotlight.map((row, i) => {
										const max = aiSpotlight[0]?.count || 1;
										const pct = (row.count / max) * 100;
										return (
											<div key={row.eventName}>
												<div className="flex items-center justify-between mb-1">
													<span className="text-xs font-medium text-muted-foreground tabular-nums">#{i + 1}</span>
													<span className="text-xs flex-1 mx-2 truncate text-foreground">{labelEvent(row.eventName)}</span>
													<Badge variant="outline" className="text-[10px] tabular-nums">{row.count}</Badge>
												</div>
												<div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
													<div
														className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
														style={{ width: `${pct}%` }}
													/>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</section>
					</div>

					{/* Top Pages + Top Events */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Top Pages */}
						<section className="bg-card rounded-xl border border-border p-5 shadow-card">
							<div className="flex items-center justify-between mb-4">
								<h2 className="font-semibold text-foreground">Top Pages</h2>
								<Badge variant="secondary" className="text-xs">{topPaths.length}</Badge>
							</div>
							{loading ? (
								<SkeletonRows rows={6} />
							) : topPaths.length === 0 ? (
								<EmptyState icon={Eye} message="No page views yet." compact />
							) : (
								<div className="space-y-2">
									{topPaths.map((row, i) => {
										const max = topPaths[0]?.views || 1;
										const pct = (row.views / max) * 100;
										return (
											<div key={row.path} className="group">
												<div className="flex items-center justify-between mb-1">
													<span className="text-xs font-medium text-muted-foreground tabular-nums">#{i + 1}</span>
													<code className="text-xs flex-1 mx-2 truncate text-foreground">{formatPath(row.path)}</code>
													<Badge variant="outline" className="text-[10px] tabular-nums">{row.views.toLocaleString()}</Badge>
												</div>
												<div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
													<div
														className="h-full bg-gradient-to-r from-sky-500 to-sky-400 rounded-full transition-all"
														style={{ width: `${pct}%` }}
													/>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</section>

						{/* Top Events */}
						<section className="bg-card rounded-xl border border-border p-5 shadow-card">
							<div className="flex items-center justify-between mb-4">
								<h2 className="font-semibold text-foreground">Top Events</h2>
								<Badge variant="secondary" className="text-xs">{topEvents.length}</Badge>
							</div>
							{loading ? (
								<SkeletonChart h="h-56" />
							) : topEvents.length === 0 ? (
								<EmptyState icon={MousePointerClick} message="No events tracked yet." compact />
							) : (
								<div className="h-56">
									<ResponsiveContainer width="100%" height="100%">
										<BarChart data={topEvents} layout="vertical" margin={{ left: 10, right: 24 }}>
											<XAxis type="number" stroke="rgba(148,163,184,0.6)" fontSize={10} allowDecimals={false} />
											<YAxis
												type="category"
												dataKey="eventName"
												stroke="rgba(148,163,184,0.6)"
												fontSize={10}
												width={120}
												tickFormatter={(v) => labelEvent(v).slice(0, 18)}
											/>
											<Tooltip
												contentStyle={{
													background: "white",
													border: "1px solid rgba(148,163,184,0.3)",
													borderRadius: 8,
													fontSize: 12, color: "#0f172a", boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
												}}
												formatter={(value: any, _name: any, props: any) => [value, labelEvent(props.payload.eventName)]}
											/>
											<Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
										</BarChart>
									</ResponsiveContainer>
								</div>
							)}
						</section>
					</div>
				</div>

				{/* Sidebar (1/3) */}
				<div className="space-y-6">
					{/* Today vs Week mini-card */}
					<section className="bg-card rounded-xl border border-border p-4 shadow-card">
						<div className="flex items-center justify-between mb-4">
							<h2 className="font-semibold text-foreground">Right Now</h2>
							<Badge className="bg-status-success/20 text-status-success text-xs">● Live</Badge>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<MiniStat label="Active today" value={totals.dau} icon={Activity} variant="amber" />
							<MiniStat label="This week" value={totals.wau} icon={Activity} variant="rose" />
							<MiniStat label="Views today" value={totals.todayViews} icon={Eye} variant="sky" />
							<MiniStat label="Events today" value={totals.todayEvents} icon={Zap} variant="lavender" />
							<MiniStat label="Sessions" value={totals.sessions} icon={Hash} variant="mint" />
							<MiniStat label="Events / session" value={totals.avgEventsPerSession} icon={Activity} variant="lavender" />
						</div>
					</section>

					{/* Trending */}
					<section className="bg-card rounded-xl border border-border p-4 shadow-card">
						<div className="flex items-center gap-2 mb-3">
							<Flame className="h-4 w-4 text-orange-500" />
							<h2 className="font-semibold text-foreground">Trending Now</h2>
						</div>
						{hottestEvent ? (
							<div>
								<p className="text-2xl font-bold mb-1">{labelEvent(hottestEvent.name)}</p>
								<p className="text-xs text-muted-foreground">
									Fired <span className="font-semibold text-foreground">{hottestEvent.count}</span> times in the last hour
								</p>
							</div>
						) : (
							<p className="text-sm text-muted-foreground py-2">No activity in the last hour.</p>
						)}
					</section>

					{/* Top Users */}
					<section className="bg-card rounded-xl border border-border p-4 shadow-card">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								<Trophy className="h-4 w-4 text-amber-500" />
								<h2 className="font-semibold text-foreground">Top Users</h2>
							</div>
							<Badge variant="outline" className="text-xs">by events</Badge>
						</div>
						{loading ? (
							<SkeletonRows rows={5} />
						) : topUsers.length === 0 ? (
							<EmptyState icon={Trophy} message="No user activity yet." compact />
						) : (
							<div className="space-y-2">
								{topUsers.map((row, i) => {
									const max = topUsers[0]?.count || 1;
									const pct = (row.count / max) * 100;
									const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
									return (
										<div key={row.userId}>
											<div className="flex items-center justify-between mb-1">
												<span className="text-xs font-bold w-6 shrink-0">{medal}</span>
												<code className="text-[10px] flex-1 mx-1 truncate text-muted-foreground">
													{row.userId.slice(0, 8)}…
												</code>
												<Badge variant="outline" className="text-[10px] tabular-nums">{row.count}</Badge>
											</div>
											<div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
												<div
													className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
													style={{ width: `${pct}%` }}
												/>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</section>

					{/* Device split */}
					<section className="bg-card rounded-xl border border-border p-4 shadow-card">
						<div className="flex items-center justify-between mb-3">
							<h2 className="font-semibold text-foreground">Device Split</h2>
							<Badge variant="outline" className="text-xs">{totalDevices.toLocaleString()} sessions</Badge>
						</div>
						{loading ? (
							<SkeletonRows rows={2} />
						) : totalDevices === 0 ? (
							<EmptyState icon={Smartphone} message="No sessions tracked yet." compact />
						) : (
							<div className="space-y-3">
								<div>
									<div className="flex items-center justify-between mb-1">
										<div className="flex items-center gap-1.5 text-xs">
											<Monitor className="h-3.5 w-3.5 text-sky-500" />
											<span className="font-medium">Desktop</span>
										</div>
										<span className="text-xs font-bold tabular-nums">
											{deviceSplit.desktop.toLocaleString()} ({desktopPct}%)
										</span>
									</div>
									<div className="h-2 bg-muted/50 rounded-full overflow-hidden">
										<div
											className="h-full bg-gradient-to-r from-sky-500 to-sky-400 rounded-full"
											style={{ width: `${desktopPct}%` }}
										/>
									</div>
								</div>
								<div>
									<div className="flex items-center justify-between mb-1">
										<div className="flex items-center gap-1.5 text-xs">
											<Smartphone className="h-3.5 w-3.5 text-emerald-500" />
											<span className="font-medium">Mobile</span>
										</div>
										<span className="text-xs font-bold tabular-nums">
											{deviceSplit.mobile.toLocaleString()} ({mobilePct}%)
										</span>
									</div>
									<div className="h-2 bg-muted/50 rounded-full overflow-hidden">
										<div
											className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
											style={{ width: `${mobilePct}%` }}
										/>
									</div>
								</div>
							</div>
						)}
					</section>

					{/* Live Feed */}
					<section className="bg-card rounded-xl border border-border p-4 shadow-card">
						<div className="flex items-center justify-between mb-4">
							<h2 className="font-semibold text-foreground">Live Activity</h2>
							<Badge variant="outline" className="text-xs">last 20</Badge>
						</div>
						{loading ? (
							<SkeletonRows rows={6} />
						) : recent.length === 0 ? (
							<EmptyState icon={Activity} message="No events yet." compact />
						) : (
							<div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 -mr-1">
								{recent.map((row) => (
									<div key={row.id} className="flex items-start gap-3">
										<div className="w-8 h-8 rounded-full bg-pastel-lavender/30 flex items-center justify-center text-xs font-medium shrink-0">
											{(row.userId ?? "👤").slice(0, 2).toUpperCase()}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm truncate">{labelEvent(row.eventName)}</p>
											{row.path && (
												<p className="text-xs text-muted-foreground truncate">on {formatPath(row.path)}</p>
											)}
											<p className="text-[10px] text-muted-foreground/70 mt-0.5">
												{formatDistanceToNow(parseUTC(row.createdAt), { addSuffix: true })}
											</p>
										</div>
									</div>
								))}
							</div>
						)}
					</section>
				</div>
			</div>
		</DashboardLayout>
	);
}

const miniVariantBg: Record<string, string> = {
	sky: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
	mint: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
	amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
	rose: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
	lavender: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
};

function MiniStat({
	label,
	value,
	icon: Icon,
	variant,
}: {
	label: string;
	value: number;
	icon: React.ComponentType<{ className?: string }>;
	variant: "sky" | "mint" | "amber" | "rose" | "lavender";
}) {
	return (
		<div className={`rounded-xl p-3 ${miniVariantBg[variant]}`}>
			<div className="flex items-center gap-1.5 mb-1">
				<Icon className="h-3 w-3" />
				<p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
			</div>
			<p className="text-xl font-bold tabular-nums">{value.toLocaleString()}</p>
		</div>
	);
}

function SkeletonChart({ h = "h-72" }: { h?: string }) {
	return (
		<div className={`${h} flex items-center justify-center`}>
			<Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
		</div>
	);
}

function SkeletonRows({ rows = 4 }: { rows?: number }) {
	return (
		<div className="space-y-3">
			{Array.from({ length: rows }).map((_, i) => (
				<div key={i} className="flex items-center gap-3 animate-pulse">
					<div className="w-8 h-8 rounded-full bg-muted/50 shrink-0" />
					<div className="flex-1 space-y-1.5">
						<div className="h-3 bg-muted/50 rounded w-3/4" />
						<div className="h-2 bg-muted/30 rounded w-1/2" />
					</div>
				</div>
			))}
		</div>
	);
}

function EmptyState({
	icon: Icon,
	message,
	compact = false,
}: {
	icon: React.ComponentType<{ className?: string }>;
	message: string;
	compact?: boolean;
}) {
	return (
		<div className={`flex flex-col items-center justify-center gap-2 text-muted-foreground ${compact ? "py-8" : "h-56"}`}>
			<Icon className="h-8 w-8 opacity-30" />
			<p className="text-sm text-center max-w-sm">{message}</p>
		</div>
	);
}
