'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MoodSelector } from "@/components/wellness/MoodSelector";
import { TrendChart } from "@/components/wellness/TrendChart";
import { InsightCard } from "@/components/wellness/InsightCard";
import { Flame, Phone, Activity, Clock3, Heart, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Wellness() {
	const [refreshKey, setRefreshKey] = useState(0);
	const [streak, setStreak] = useState(0);
	const [weeklyAverage, setWeeklyAverage] = useState<number | null>(null);
	const [weeklyLogs, setWeeklyLogs] = useState(0);
	const [lastLoggedAt, setLastLoggedAt] = useState<string | null>(null);

	// Calculate Streak
	// Logic: Count consecutive days going backwards from today/yesterday.
	useEffect(() => {
		const fetchStats = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;

			const { data: logs } = await supabase
				.from('MoodLog')
				.select('moodScore, loggedAt')
				.eq('userId', user.id)
				.order('loggedAt', { ascending: false });

			if (!logs || logs.length === 0) {
				setStreak(0);
				setWeeklyAverage(null);
				setWeeklyLogs(0);
				setLastLoggedAt(null);
				return;
			}

			setLastLoggedAt(logs[0].loggedAt);

			const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
			const recentLogs = logs.filter((log) => new Date(log.loggedAt).getTime() >= sevenDaysAgo);
			setWeeklyLogs(recentLogs.length);

			if (recentLogs.length > 0) {
				const avg = recentLogs.reduce((sum, log) => sum + (log.moodScore ?? 0), 0) / recentLogs.length;
				setWeeklyAverage(Number(avg.toFixed(1)));
			} else {
				setWeeklyAverage(null);
			}

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

						<MoodSelector onLogComplete={() => setRefreshKey(prev => prev + 1)} />
						<InsightCard refreshKey={refreshKey} />
					</div>

					{/* Right Sidebar */}
					<div className="w-full lg:w-[300px] shrink-0 space-y-6">

						{/* Streak Card */}
						<div className="bg-gradient-to-br from-orange-500/15 via-card/40 to-card/40 backdrop-blur-xl border border-orange-500/20 rounded-[2.5rem] p-7 relative overflow-hidden group">
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
						<div className="bg-gradient-to-br from-red-500/10 via-card/40 to-card/40 backdrop-blur-xl border border-red-500/20 rounded-[2.5rem] p-7 relative overflow-hidden">
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
							</div>
						</div>

					</div>
				</div>
			</div>
		</DashboardLayout>
	);
};
