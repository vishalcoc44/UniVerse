'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MoodSelector } from "@/components/wellness/MoodSelector";
import { TrendChart } from "@/components/wellness/TrendChart";
import { InsightCard } from "@/components/wellness/InsightCard";
import { Card } from "@/components/ui/card";
import { Flame, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Wellness() {
	const [refreshKey, setRefreshKey] = useState(0);
	const [streak, setStreak] = useState(0);

	// Calculate Streak
	// Logic: Count consecutive days going backwards from today/yesterday.
	useEffect(() => {
		const fetchStreak = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;

			const { data: logs } = await supabase
				.from('MoodLog')
				.select('loggedAt')
				.eq('userId', user.id)
				.order('loggedAt', { ascending: false });

			if (!logs || logs.length === 0) {
				setStreak(0);
				return;
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

		fetchStreak();
	}, [refreshKey]);

	return (
		<DashboardLayout
			title="Mental Wellness"
			subtitle="Prioritize your peace of mind."
			breadcrumb={["UniVerse", "Wellness"]}
		>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Main Interaction Area */}
				<div className="lg:col-span-2 space-y-6">
					<MoodSelector onLogComplete={() => setRefreshKey(prev => prev + 1)} />
					<InsightCard refreshKey={refreshKey} />
				</div>

				{/* Sidebar Stats & Tools */}
				<div className="space-y-6">
					<Card className="p-6 bg-card/40 border-border/50 flex items-center justify-between">
						<div>
							<p className="text-sm text-muted-foreground mb-1">Mindfulness Streak</p>
							<h3 className="text-3xl font-bold font-mono">{streak} Days</h3>
						</div>
						<div className="h-14 w-14 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 animate-pulse">
							<Flame className="h-8 w-8 fill-current" />
						</div>
					</Card>

					<div className="h-[250px]">
						<TrendChart refreshKey={refreshKey} />
					</div>

					<Card className="p-4 bg-red-500/5 border-red-500/20">
						<div className="flex items-center gap-3 mb-2">
							<div className="p-2 bg-red-500/10 rounded-full text-red-500">
								<Phone className="h-4 w-4" />
							</div>
							<h4 className="font-semibold text-red-700 dark:text-red-400">Crisis Support</h4>
						</div>
						<p className="text-xs text-muted-foreground mb-3">
							If you're feeling overwhelmed, confidential help is available 24/7.
						</p>
						<Button className="w-full bg-red-600 hover:bg-red-700 text-white" size="sm">
							Get Help Now
						</Button>
					</Card>
				</div>
			</div>
		</DashboardLayout>
	);
};
