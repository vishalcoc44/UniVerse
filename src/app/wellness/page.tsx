'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MoodSelector } from "@/components/wellness/MoodSelector";
import { TrendChart } from "@/components/wellness/TrendChart";
import { InsightCard } from "@/components/wellness/InsightCard";
import { Flame, Phone, Activity, Clock3, Heart, Shield, TrendingUp, Sparkles, Mail, Users, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MoodLogEntry {
	id: string;
	moodScore: number;
	notes: string | null;
	activities: string[] | null;
	loggedAt: string;
}

interface CrisisSupport {
	label: string;
	number: string;
}

interface AdminContact {
	id: string;
	fullName: string | null;
	email: string | null;
	universityEmail: string | null;
}

const MOOD_META: Record<number, { emoji: string; label: string; color: string }> = {
	1: { emoji: "😖", label: "Stressed", color: "text-red-500" },
	2: { emoji: "😕", label: "Anxious", color: "text-orange-500" },
	3: { emoji: "😐", label: "Okay", color: "text-yellow-500" },
	4: { emoji: "🙂", label: "Good", color: "text-green-500" },
	5: { emoji: "🤩", label: "Great", color: "text-emerald-500" },
};

const LOW_WEEKLY_SCORE_THRESHOLD = 3;

export default function Wellness() {
	const [refreshKey, setRefreshKey] = useState(0);
	const [streak, setStreak] = useState(0);
	const [weeklyAverage, setWeeklyAverage] = useState<number | null>(null);
	const [weeklyMomentum, setWeeklyMomentum] = useState<number | null>(null);
	const [weeklyLogs, setWeeklyLogs] = useState(0);
	const [lastLoggedAt, setLastLoggedAt] = useState<string | null>(null);
	const [recentCheckIns, setRecentCheckIns] = useState<MoodLogEntry[]>([]);
	const [topActivities, setTopActivities] = useState<Array<{ label: string; count: number }>>([]);
	const [bestDay, setBestDay] = useState<string | null>(null);
	const [worstDay, setWorstDay] = useState<string | null>(null);
	const [weeklyRecommendation, setWeeklyRecommendation] = useState<string>("Start your check-ins to get a personalized recommendation.");
	const [adminContacts, setAdminContacts] = useState<AdminContact[]>([]);
	const [collegeCrisisSupport, setCollegeCrisisSupport] = useState<CrisisSupport[]>([]);
	const [isAddingCrisis, setIsAddingCrisis] = useState(false);
	const [newCrisisLabel, setNewCrisisLabel] = useState("");
	const [newCrisisNumber, setNewCrisisNumber] = useState("");
	const [isUpdatingCrisis, setIsUpdatingCrisis] = useState(false);
	const [universityData, setUniversityData] = useState<{ id: string; name: string } | null>(null);
	const [userRole, setUserRole] = useState<string | null>(null);

	// Calculate Streak
	// Logic: Count consecutive days going backwards from today/yesterday.
	useEffect(() => {
		const fetchStats = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;

			const { data: profile } = await supabase
				.from('Profile')
				.select('universityId, role')
				.eq('id', user.id)
				.single();

			setUserRole(profile?.role || null);

			if (profile?.universityId) {
				const { data: uni } = await supabase
					.from('University')
					.select('id, name, crisisSupport')
					.eq('id', profile.universityId)
					.single();
				
				if (uni) {
					setUniversityData({ id: uni.id, name: uni.name });
					setCollegeCrisisSupport((uni.crisisSupport as CrisisSupport[]) || []);
				}

				const { data: admins } = await supabase
					.from('Profile')
					.select('id, fullName, email, universityEmail')
					.eq('role', 'ADMIN')
					.eq('universityId', profile.universityId)
					.order('fullName', { ascending: true });
				setAdminContacts((admins ?? []) as AdminContact[]);
			} else {
				setAdminContacts([]);
				setCollegeCrisisSupport([]);
			}

			const { data: logs } = await supabase
				.from('MoodLog')
				.select('id, moodScore, notes, activities, loggedAt')
				.eq('userId', user.id)
				.order('loggedAt', { ascending: false });

			if (!logs || logs.length === 0) {
				setStreak(0);
				setWeeklyAverage(null);
				setWeeklyMomentum(null);
				setWeeklyLogs(0);
				setLastLoggedAt(null);
				setRecentCheckIns([]);
				setTopActivities([]);
				setBestDay(null);
				setWorstDay(null);
				setWeeklyRecommendation("Start your check-ins to get a personalized recommendation.");
				return;
			}

			setRecentCheckIns((logs as MoodLogEntry[]).slice(0, 5));

			setLastLoggedAt(logs[0].loggedAt);

			const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
			const recentLogs = logs.filter((log) => new Date(log.loggedAt).getTime() >= sevenDaysAgo);
			setWeeklyLogs(recentLogs.length);

			if (recentLogs.length > 0) {
				const avg = recentLogs.reduce((sum, log) => sum + (log.moodScore ?? 0), 0) / recentLogs.length;
				setWeeklyAverage(Number(avg.toFixed(1)));

				const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
				const previousWeekLogs = logs.filter((log) => {
					const ts = new Date(log.loggedAt).getTime();
					return ts < sevenDaysAgo && ts >= fourteenDaysAgo;
				});

				if (previousWeekLogs.length > 0) {
					const prevAvg = previousWeekLogs.reduce((sum, log) => sum + (log.moodScore ?? 0), 0) / previousWeekLogs.length;
					setWeeklyMomentum(Number((avg - prevAvg).toFixed(1)));
				} else {
					setWeeklyMomentum(null);
				}

				if (avg < 2.5) {
					setWeeklyRecommendation("Your week looks heavy. Prioritize sleep + one short calming activity daily, and consider reaching out for support.");
				} else if (avg < 3.5) {
					setWeeklyRecommendation("You’re maintaining okay. Keep consistent check-ins and add one positive habit (walk, hydration, or 10-minute break).");
				} else {
					setWeeklyRecommendation("Strong week. Keep momentum by repeating the routines that worked best on your top days.");
				}
			} else {
				setWeeklyAverage(null);
				setWeeklyMomentum(null);
				setWeeklyRecommendation("No recent data this week — log at least one mood per day for better insights.");
			}

			const dayBuckets = new Map<string, number[]>();
			recentLogs.forEach((log) => {
				const dayKey = new Date(log.loggedAt).toDateString();
				const current = dayBuckets.get(dayKey) ?? [];
				current.push(log.moodScore ?? 0);
				dayBuckets.set(dayKey, current);
			});

			const dayAverages = Array.from(dayBuckets.entries()).map(([date, scores]) => ({
				date,
				average: scores.reduce((a, b) => a + b, 0) / scores.length,
			}));

			if (dayAverages.length > 0) {
				const best = [...dayAverages].sort((a, b) => b.average - a.average)[0];
				const worst = [...dayAverages].sort((a, b) => a.average - b.average)[0];
				setBestDay(new Date(best.date).toLocaleDateString(undefined, { weekday: 'short' }));
				setWorstDay(new Date(worst.date).toLocaleDateString(undefined, { weekday: 'short' }));
			} else {
				setBestDay(null);
				setWorstDay(null);
			}

			const activityCount = new Map<string, number>();
			recentLogs.forEach((log) => {
				(log.activities ?? []).forEach((activity: string) => {
					activityCount.set(activity, (activityCount.get(activity) ?? 0) + 1);
				});
			});
			setTopActivities(
				Array.from(activityCount.entries())
					.sort((a, b) => b[1] - a[1])
					.slice(0, 4)
					.map(([label, count]) => ({ label, count }))
			);

			const uniqueDates = Array.from(new Set((logs as any[]).map(log =>
				new Date(log.loggedAt).toDateString()
			)));

			let currentStreak = 0;
			const today = new Date().toDateString();
			const yesterday = new Date(Date.now() - 86400000).toDateString();

			// Check if chain starts today or yesterday
			if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
				setStreak(0);
				return;
			}

			// Iterate to count consecutive days
			// We'll normalize dates to start checking from the most recent log
			let checkDate = new Date(uniqueDates[0]);

			for (let i = 0; i < uniqueDates.length; i++) {
				const dateStr = uniqueDates[i];
				// Compare date strings to avoid time issues
				if (new Date(dateStr).toDateString() === checkDate.toDateString()) {
					currentStreak++;
					// Move checkDate back by one day
					checkDate.setDate(checkDate.getDate() - 1);
				} else {
					break;
				}
			}

			setStreak(currentStreak);
		};

		fetchStats();
	}, [refreshKey]);

	const getLastCheckInLabel = () => {
		if (!lastLoggedAt) return "No check-ins yet";
		const date = new Date(lastLoggedAt);
		return date.toLocaleString(undefined, {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit"
		});
	};

	const moodColor = weeklyAverage === null ? "text-muted-foreground" :
		weeklyAverage <= 2 ? "text-red-500" :
			weeklyAverage <= 3 ? "text-yellow-500" : "text-emerald-500";

	const momentumColor = weeklyMomentum === null
		? "text-muted-foreground"
		: weeklyMomentum >= 0
			? "text-emerald-500"
			: "text-red-500";

	const handleAddCrisis = async () => {
		if (!universityData || !newCrisisLabel || !newCrisisNumber) return;
		setIsUpdatingCrisis(true);
		
		const updatedSupport = [...collegeCrisisSupport, { label: newCrisisLabel, number: newCrisisNumber }];
		
		const { error } = await supabase
			.from("University")
			.update({ crisisSupport: updatedSupport })
			.eq("id", universityData.id);

		if (error) {
			console.error("Error updating crisis support:", error);
		} else {
			setCollegeCrisisSupport(updatedSupport);
			setNewCrisisLabel("");
			setNewCrisisNumber("");
			setIsAddingCrisis(false);
			// Refresh key to ensure UI and state are perfectly aligned with DB
			setRefreshKey(prev => prev + 1);
		}
		setIsUpdatingCrisis(false);
	};

	const handleDeleteCrisis = async (index: number) => {
		if (!universityData) return;
		setIsUpdatingCrisis(true);
		
		const updatedSupport = collegeCrisisSupport.filter((_, i) => i !== index);
		
		const { error } = await supabase
			.from("University")
			.update({ crisisSupport: updatedSupport })
			.eq("id", universityData.id);

		if (error) {
			console.error("Error deleting crisis support:", error);
		} else {
			setCollegeCrisisSupport(updatedSupport);
		}
		setIsUpdatingCrisis(false);
	};

	const handleAddAdminContact = async () => {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user || !universityData) return;
		setIsUpdatingCrisis(true);

		const { error } = await supabase
			.from('Profile')
			.update({ role: 'ADMIN', universityId: universityData.id })
			.eq('id', user.id);

		if (error) {
			console.error("Error setting admin role:", error);
		} else {
			// Refresh stats to update admin list
			setRefreshKey(prev => prev + 1);
		}
		setIsUpdatingCrisis(false);
	};

	const handleDeleteAdminContact = async (adminId: string) => {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user || user.id !== adminId) return; // Only allow deleting yourself for now to avoid complexity
		setIsUpdatingCrisis(true);

		const { error } = await supabase
			.from('Profile')
			.update({ role: 'STUDENT' })
			.eq('id', adminId);

		if (error) {
			console.error("Error removing admin role:", error);
		} else {
			setRefreshKey(prev => prev + 1);
		}
		setIsUpdatingCrisis(false);
	};

	const showAdminSupport = weeklyAverage !== null && weeklyAverage < LOW_WEEKLY_SCORE_THRESHOLD;

	return (
		<DashboardLayout
			title={
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
						<Heart className="h-6 w-6" />
					</div>
					<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
						Mental <span className="text-primary">Wellness</span>
					</h1>
				</div>
			}
			subtitle="Prioritize your peace of mind."
			breadcrumb={["UniVerse", "Wellness"]}
		>
			<div className="max-w-7xl mx-auto pb-20 w-full overflow-x-hidden">
				<div className="flex flex-col lg:flex-row gap-8">

					{/* Main Content */}
					<div className="flex-1 min-w-0 space-y-8">

						{/* Stat Cards */}
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							{[
								{
									label: "7-Day Average",
									value: weeklyAverage !== null ? `${weeklyAverage}` : "—",
									suffix: weeklyAverage !== null ? "/ 5" : "",
									icon: Heart,
									color: "text-pink-500",
									bg: "from-pink-500/10 to-transparent",
									border: "border-pink-500/10",
								},
								{
									label: "Check-ins This Week",
									value: String(weeklyLogs),
									suffix: "entries",
									icon: Activity,
									color: "text-primary",
									bg: "from-primary/10 to-transparent",
									border: "border-primary/10",
								},
								{
									label: "Last Check-in",
									value: getLastCheckInLabel(),
									suffix: "",
									icon: Clock3,
									color: "text-violet-500",
									bg: "from-violet-500/10 to-transparent",
									border: "border-violet-500/10",
								},
							].map((stat, i) => (
								<motion.div
									key={stat.label}
									initial={{ opacity: 0, y: 16 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: i * 0.07 }}
									className={cn(
										"bg-gradient-to-br bg-card/40 backdrop-blur-xl border rounded-[2rem] p-6 relative overflow-hidden group",
										stat.border
									)}
								>
									<div className={cn("absolute inset-0 bg-gradient-to-br opacity-40", stat.bg)} />
									<div className="relative">
										<div className="flex items-center justify-between mb-3">
											<p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/60">{stat.label}</p>
											<div className={cn("p-2 rounded-xl bg-card/60 border border-border/30", stat.color)}>
												<stat.icon className="h-4 w-4" />
											</div>
										</div>
										<p className={cn("text-3xl font-black italic tracking-tighter", stat.label === "7-Day Average" ? moodColor : "text-foreground")}>
											{stat.value}
											{stat.suffix && <span className="text-sm font-bold text-muted-foreground ml-1.5 not-italic">{stat.suffix}</span>}
										</p>
									</div>
								</motion.div>
							))}
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<motion.div
								initial={{ opacity: 0, y: 16 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2 }}
								className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-6"
							>
								<div className="flex items-center justify-between mb-2">
									<p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/60">Weekly Momentum</p>
									<TrendingUp className={cn("h-4 w-4", momentumColor)} />
								</div>
								<p className={cn("text-3xl font-black italic tracking-tighter", momentumColor)}>
									{weeklyMomentum === null ? "—" : `${weeklyMomentum > 0 ? '+' : ''}${weeklyMomentum}`}
									<span className="text-sm font-bold text-muted-foreground ml-1.5 not-italic">vs last week</span>
								</p>
							</motion.div>

							<motion.div
								initial={{ opacity: 0, y: 16 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.27 }}
								className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-6"
							>
								<div className="flex items-center justify-between mb-3">
									<p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/60">Top Activities</p>
									<Sparkles className="h-4 w-4 text-primary" />
								</div>
								{topActivities.length === 0 ? (
									<p className="text-xs text-muted-foreground italic">Log activities during check-ins to unlock this insight.</p>
								) : (
									<div className="flex flex-wrap gap-2">
										{topActivities.map((activity) => (
											<div key={activity.label} className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
												{activity.label} · {activity.count}
											</div>
										))}
									</div>
								)}
							</motion.div>
						</div>

					<div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl md:rounded-[2.5rem] p-4 md:p-7">
						<div className="flex items-center justify-between mb-4">
							<h3 className="font-black text-sm italic tracking-tight uppercase">Sunday Recap</h3>
								<span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Weekly Summary</span>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
								<div className="rounded-2xl border border-border/30 bg-card/30 p-4">
									<p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Average Mood</p>
									<p className={cn("text-2xl font-black italic mt-1", moodColor)}>{weeklyAverage ?? "—"}<span className="text-sm text-muted-foreground not-italic"> / 5</span></p>
								</div>
								<div className="rounded-2xl border border-border/30 bg-card/30 p-4">
									<p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Streak Progress</p>
									<p className="text-2xl font-black italic mt-1 text-orange-500">{Math.min(streak, 7)} / 7</p>
								</div>
								<div className="rounded-2xl border border-border/30 bg-card/30 p-4">
									<p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Best Day</p>
									<p className="text-xl font-black italic mt-1 text-emerald-500">{bestDay ?? "—"}</p>
								</div>
								<div className="rounded-2xl border border-border/30 bg-card/30 p-4">
									<p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Toughest Day</p>
									<p className="text-xl font-black italic mt-1 text-red-500">{worstDay ?? "—"}</p>
								</div>
							</div>

							<div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-4">
								<p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-2">Top Activities</p>
								{topActivities.length === 0 ? (
									<p className="text-xs text-muted-foreground italic">No activity trends yet this week.</p>
								) : (
									<div className="flex flex-wrap gap-2">
										{topActivities.map((activity) => (
											<span key={activity.label} className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
												{activity.label} · {activity.count}
											</span>
										))}
									</div>
								)}
							</div>

							<div className="rounded-2xl border border-border/30 bg-card/30 p-4">
								<p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">One Recommendation</p>
								<p className="text-sm text-muted-foreground leading-relaxed">{weeklyRecommendation}</p>
							</div>
						</div>

						<MoodSelector onLogComplete={() => setRefreshKey(prev => prev + 1)} />

					<div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl md:rounded-[2.5rem] p-4 md:p-7">
						<div className="flex items-center justify-between mb-5">
								<h3 className="font-black text-sm italic tracking-tight uppercase">Recent Check-ins</h3>
								<span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Last 5 entries</span>
							</div>
							{recentCheckIns.length === 0 ? (
								<p className="text-xs text-muted-foreground italic">No check-ins yet. Log your first mood above.</p>
							) : (
								<div className="space-y-3">
									{recentCheckIns.map((entry) => {
										const mood = MOOD_META[entry.moodScore] ?? MOOD_META[3];
										return (
											<div key={entry.id} className="rounded-2xl border border-border/30 bg-card/30 p-4">
												<div className="flex items-center justify-between gap-2">
													<div className="flex items-center gap-2">
														<span className="text-xl">{mood.emoji}</span>
														<p className={cn("text-xs font-black uppercase tracking-wide", mood.color)}>{mood.label}</p>
													</div>
													<p className="text-[10px] text-muted-foreground font-bold">
														{new Date(entry.loggedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
													</p>
												</div>
												{entry.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{entry.notes}</p>}
												{entry.activities && entry.activities.length > 0 && (
													<div className="mt-2 flex flex-wrap gap-1.5">
														{entry.activities.slice(0, 4).map((activity) => (
															<span key={activity} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
																{activity}
															</span>
														))}
													</div>
												)}
											</div>
										);
									})}
								</div>
							)}
						</div>
						<InsightCard refreshKey={refreshKey} />
					</div>

					{/* Right Sidebar */}
					<div className="w-full lg:w-[300px] shrink-0 space-y-6">

						{/* Streak Card */}
						<div className="bg-gradient-to-br from-orange-500/15 via-card/40 to-card/40 backdrop-blur-xl border border-orange-500/20 rounded-2xl md:rounded-[2.5rem] p-4 md:p-7 relative overflow-hidden group">
							<div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
								<Flame className="h-28 w-28 fill-current text-orange-500" />
							</div>
							<div className="relative">
								<div className="flex items-center gap-3 mb-4">
									<div className="p-2.5 rounded-2xl bg-orange-500/15 text-orange-500">
										<Flame className="h-5 w-5 fill-current" />
									</div>
									<p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Mindfulness Streak</p>
								</div>
								<p className="text-5xl font-black italic tracking-tighter text-orange-500">{streak}</p>
								<p className="text-sm font-bold italic text-muted-foreground tracking-tight mt-1">
									{streak === 0 ? "Start your streak today" : streak === 1 ? "day in a row — keep it up!" : "days in a row — on fire!"}
								</p>
								<div className="mt-5 h-1.5 w-full bg-orange-500/10 rounded-full overflow-hidden">
									<div
										className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-700"
										style={{ width: `${Math.min(streak * 14.3, 100)}%` }}
									/>
								</div>
								<p className="text-[10px] text-muted-foreground/50 font-bold mt-1.5 tracking-widest uppercase">{Math.min(streak, 7)} / 7 day goal</p>
							</div>
						</div>

						{/* Trend Chart */}
						<div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] overflow-hidden">
							<TrendChart refreshKey={refreshKey} />
						</div>

						{/* Crisis Support */}
						<div className="bg-gradient-to-br from-red-500/10 via-card/40 to-card/40 backdrop-blur-xl border border-red-500/20 rounded-2xl md:rounded-[2.5rem] p-4 md:p-7 relative overflow-hidden">
							<div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
								<Shield className="h-24 w-24 text-red-500" />
							</div>
							<div className="relative">
								<div className="flex items-center gap-3 mb-4">
									<div className="p-2.5 rounded-2xl bg-red-500/10 text-red-500">
										<Phone className="h-5 w-5" />
									</div>
									<h4 className="font-black italic tracking-tight uppercase text-red-400">Crisis Support</h4>
								</div>
								<p className="text-xs text-muted-foreground leading-relaxed mb-6">
									Feeling overwhelmed? Confidential help is available <span className="font-bold text-foreground">24/7, free of charge</span>. You're not alone.
								</p>
								<Button asChild className="w-full h-12 rounded-2xl bg-red-600 hover:bg-red-700 font-black italic tracking-tighter shadow-xl shadow-red-500/20 text-white">
									<a href="tel:988">Call 988 — Get Help Now</a>
								</Button>

								{/* College Specific Support */}
								{collegeCrisisSupport.length > 0 && (
									<div className="mt-6 space-y-3">
										<p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">College Support</p>
										{collegeCrisisSupport.map((support, idx) => (
											<div key={idx} className="flex items-center gap-2">
												<Button asChild variant="outline" className="flex-1 h-10 rounded-xl border-red-500/20 bg-red-500/5 hover:bg-red-500/10 font-bold text-xs tracking-tight">
													<a href={`tel:${support.number}`}>{support.label}: {support.number}</a>
												</Button>
												{userRole === "ADMIN" && (
													<Button 
														variant="ghost" 
														size="icon" 
														className="h-10 w-10 text-muted-foreground hover:text-red-500"
														onClick={() => handleDeleteCrisis(idx)}
														disabled={isUpdatingCrisis}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												)}
											</div>
										))}
									</div>
								)}

								{/* Admin controls to add support */}
								{userRole === "ADMIN" && (
									<div className="mt-6 pt-6 border-t border-red-500/10">
										{!isAddingCrisis ? (
											<Button 
												variant="ghost" 
												onClick={() => setIsAddingCrisis(true)}
												className="w-full text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 hover:bg-red-500/5"
											>
												<Plus className="h-3 w-3 mr-1.5" /> Add Campus Support
											</Button>
										) : (
											<div className="space-y-3">
												<Input 
													placeholder="Service Name (e.g. Campus Police)" 
													value={newCrisisLabel}
													onChange={(e) => setNewCrisisLabel(e.target.value)}
													className="h-9 text-xs rounded-xl bg-card/50 border-red-500/20"
												/>
												<Input 
													placeholder="Phone Number" 
													value={newCrisisNumber}
													onChange={(e) => setNewCrisisNumber(e.target.value)}
													className="h-9 text-xs rounded-xl bg-card/50 border-red-500/20"
												/>
												<div className="flex gap-2">
													<Button 
														variant="ghost" 
														onClick={() => setIsAddingCrisis(false)}
														className="flex-1 h-8 text-[10px] uppercase font-bold"
													>
														Cancel
													</Button>
													<Button 
														onClick={handleAddCrisis}
														disabled={isUpdatingCrisis || !newCrisisLabel || !newCrisisNumber}
														className="flex-1 h-8 text-[10px] uppercase font-bold bg-red-500/20 text-red-500 hover:bg-red-500/30"
													>
														{isUpdatingCrisis ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
													</Button>
												</div>
											</div>
										)}
									</div>
								)}
							</div>
						</div>

						{showAdminSupport && (
							<div className="bg-gradient-to-br from-amber-500/10 via-card/40 to-card/40 backdrop-blur-xl border border-amber-500/30 rounded-2xl md:rounded-[2.5rem] p-4 md:p-7 relative overflow-hidden">
								<div className="relative">
									<div className="flex items-center gap-3 mb-4">
										<div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
											<Users className="h-5 w-5" />
										</div>
										<h4 className="font-black italic tracking-tight uppercase text-amber-400">College Admin Support</h4>
									</div>
									<p className="text-xs text-muted-foreground leading-relaxed mb-4">
										Your weekly wellness score is below target. You can reach out to your college admins for support.
									</p>
									<div className="space-y-4">
										{adminContacts.length === 0 ? (
											<p className="text-xs text-muted-foreground italic">No admin contacts found for your college.</p>
										) : (
											adminContacts.map((admin) => {
												const email = admin.universityEmail || admin.email;
												if (!email) return null;
												return (
													<div key={admin.id} className="flex items-center gap-2">
														<Button asChild variant="outline" className="flex-1 justify-start rounded-2xl border-amber-500/30 hover:bg-amber-500/10">
															<a href={`mailto:${email}?subject=Wellness support request&body=Hi, I need support regarding my weekly wellness check-ins.`}>
																<Mail className="h-4 w-4 mr-2" /> {admin.fullName || 'Admin'}
															</a>
														</Button>
														{userRole === "ADMIN" && (
															<Button
																variant="ghost"
																size="icon"
																className="h-10 w-10 text-muted-foreground hover:text-red-500"
																onClick={() => handleDeleteAdminContact(admin.id)}
																disabled={isUpdatingCrisis}
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														)}
													</div>
												);
											})
										)}

										{/* Admin controls to add self as contact */}
										{userRole === "ADMIN" && !adminContacts.some(a => universityData?.id && a.id === universityData.id) && (
											<div className="pt-4 border-t border-amber-500/10">
												<Button
													variant="ghost"
													onClick={handleAddAdminContact}
													disabled={isUpdatingCrisis}
													className="w-full text-[10px] font-black uppercase tracking-widest text-amber-500/60 hover:text-amber-500 hover:bg-amber-500/5 group"
												>
													{isUpdatingCrisis ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Plus className="h-3 w-3 mr-1.5 group-hover:scale-110 transition-transform" />}
													Add Yourself as Contact
												</Button>
											</div>
										)}
									</div>
								</div>
							</div>
						)}

					</div>
				</div>
			</div>
		</DashboardLayout>
	);
};
