'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClubGrid } from "@/components/clubs/ClubGrid";
import { useState } from "react";
import { Globe2, School, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ClubsPage() {
	const [scope, setScope] = useState<'campus' | 'universe'>('campus');

	return (
		<DashboardLayout
			title={
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
						<Trophy className="h-6 w-6" />
					</div>
					<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
						Clubs & <span className="text-primary">Societies</span>
					</h1>
				</div>
			}
			subtitle="Find student-run clubs and connect with others who share your interests."
			breadcrumb={["UniVerse", "Clubs"]}
		>
			<div className="space-y-6">
				{/* Scope Switcher */}
				<div className="flex items-center justify-between">
					<div className="inline-flex p-1 bg-muted/50 rounded-xl border border-border/50">
						{[
							{ id: "campus", label: "On Campus", icon: School },
							{ id: "universe", label: "Across Universities", icon: Globe2 }
						].map((s) => (
							<button
								key={s.id}
								onClick={() => setScope(s.id as any)}
								className={cn(
									"relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
									scope === s.id
										? "text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								{scope === s.id && (
									<motion.div
										layoutId="clubScope"
										className="absolute inset-0 bg-primary rounded-lg shadow-md"
										transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
									/>
								)}
								<s.icon className="h-4 w-4 relative z-10" />
								<span className="relative z-10">{s.label}</span>
							</button>
						))}
					</div>
				</div>

				{/* Club Grid */}
				<ClubGrid scope={scope} />
			</div>
		</DashboardLayout>
	);
}
