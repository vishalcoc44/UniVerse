'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClubGrid } from "@/components/clubs/ClubGrid";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe2, School, Sparkles, Trophy, Users, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ClubsPage() {
	const [scope, setScope] = useState<'campus' | 'universe'>('campus');

	return (
		<DashboardLayout
			title=""
			subtitle=""
			breadcrumb={["UniVerse", "Clubs"]}
		>
			<div className="max-w-[1400px] mx-auto pb-20 space-y-6 px-4 md:px-6 -mt-12">
				{/* Hero Section */}
				<motion.section
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="relative p-8 md:p-12 rounded-[3.5rem] bg-card/40 backdrop-blur-xl border border-border/50 overflow-hidden group shadow-2xl shadow-primary/5"
				>
					{/* Background Decorative Elements */}
					<div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
						<Trophy className="h-64 w-64 -mr-20 -mt-20 rotate-12 text-primary" />
					</div>
					<div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
					<div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary/10 rounded-full blur-[100px]" />

					<div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
						<div className="max-w-3xl space-y-6">
							<div className="flex flex-wrap items-center gap-3">
								<Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-4 py-1.5 rounded-full font-bold tracking-wider text-[10px]">
									<Sparkles className="h-3 w-3 mr-2" />
									Active Clubs
								</Badge>
								<div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
								<span className="text-[10px] font-medium tracking-wider text-muted-foreground/60">
									Find and join clubs on campus
								</span>
							</div>

							<div className="space-y-2">
								<h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
									Student <br />
									<span className="text-primary italic">Organizations</span>
								</h1>
								<p className="text-base font-medium text-muted-foreground tracking-tight max-w-xl">
									Find student-run clubs on campus and connect with others who share your interests.
								</p>
							</div>

							{/* Scope Switcher */}
							<div className="inline-flex p-1.5 bg-card/60 backdrop-blur-md rounded-[2rem] border border-border/30 shadow-inner">
								{[
									{ id: "campus", label: "On Campus", icon: School },
									{ id: "universe", label: "Across Universities", icon: Globe2 }
								].map((s) => (
									<button
										key={s.id}
										onClick={() => setScope(s.id as any)}
										className={cn(
											"relative flex items-center gap-2.5 px-6 py-2.5 rounded-[1.5rem] text-sm font-bold tracking-tight transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
											scope === s.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
										)}
									>
										{scope === s.id && (
											<motion.div
												layoutId="activeScope"
												className="absolute inset-0 bg-primary rounded-[1.5rem] shadow-lg shadow-primary/20"
												transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
											/>
										)}
										<s.icon className={cn("h-4 w-4 relative z-10 transition-transform", scope === s.id && "scale-110")} />
										<span className="relative z-10">{s.label}</span>
									</button>
								))}
							</div>
						</div>

						{/* Stats Visualizer */}
						<div className="flex flex-col sm:flex-row lg:flex-col gap-4">
							<div className="bg-card/60 backdrop-blur-xl border border-border/50 p-6 rounded-2xl shadow-xl min-w-[200px]">
								<div className="flex items-center gap-3 mb-2 text-primary">
									<Users className="h-5 w-5" />
									<span className="font-semibold tracking-wider text-[10px] text-muted-foreground/60">Members</span>
								</div>
								<div className="flex items-baseline gap-1">
									<span className="text-2xl font-extrabold">8.4k</span>
									<span className="text-xs font-medium text-primary">+12%</span>
								</div>
							</div>
							<div className="bg-card/60 backdrop-blur-xl border border-border/50 p-6 rounded-2xl shadow-xl min-w-[200px]">
								<div className="flex items-center gap-3 mb-2 text-secondary">
									<Zap className="h-5 w-5" />
									<span className="font-semibold tracking-wider text-[10px] text-muted-foreground/60">Events This Week</span>
								</div>
								<div className="flex items-baseline gap-1">
									<span className="text-2xl font-extrabold">142</span>
									<span className="text-xs font-medium text-secondary">Active</span>
								</div>
							</div>
						</div>
					</div>
				</motion.section>

				<div className="relative z-20">
					<ClubGrid scope={scope} />
				</div>
			</div>
		</DashboardLayout>
	);
}
