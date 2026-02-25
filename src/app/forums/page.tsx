'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ForumCategoryGrid } from "@/components/forums/ForumCategoryGrid";
import { ThreadList } from "@/components/forums/ThreadList";
import { useState } from "react";
import { AnonymousPostComposer } from "@/components/forums/AnonymousPostComposer";
import { Flame, Clock, Grid2X2, Sparkles, Globe2, Building2, Search, MessageSquarePlus, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ForumsPage() {
	const [activeCategory, setActiveCategory] = useState("all");
	const [activeScope, setActiveScope] = useState<"campus" | "universe">("campus");
	const [activeTab, setActiveTab] = useState<"latest" | "trending" | "categories">("latest");
	const [refreshKey, setRefreshKey] = useState(0);

	const refreshThreads = () => setRefreshKey(prev => prev + 1);

	const tabs = [
		{ id: "latest", label: "Recent Feed", icon: Clock },
		{ id: "trending", label: "Trending Now", icon: TrendingUp },
		{ id: "categories", label: "By Category", icon: Grid2X2 },
	] as const;

	return (
		<DashboardLayout
			title=""
			subtitle=""
			breadcrumb={["UniVerse", "Forums"]}
		>
			<div className="max-w-[1400px] mx-auto pb-20 space-y-4 px-6 -mt-16">
				{/* Hero Section */}
				<motion.section 
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="relative px-10 py-10 rounded-[3.5rem] bg-card/40 backdrop-blur-xl border border-border/50 overflow-hidden group shadow-2xl shadow-primary/5"
				>
					<div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
						<VenetianMask className="h-64 w-64 -mr-20 -mt-20 rotate-12" />
					</div>
					
					<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
						<div className="max-w-3xl space-y-5">
							<div className="flex flex-wrap items-center gap-3">
								<Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-4 py-1.5 rounded-full font-black italic tracking-widest text-[10px] uppercase">
									<Sparkles className="h-3 w-3 mr-2" />
									Encrypted & Anonymous
								</Badge>
								<div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
								<span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">
									University Network Secured
								</span>
							</div>
							
							<div className="space-y-1">
								<h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-foreground leading-[0.9]">
									UNFILTERED <br />
									<span className="text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">VOICES.</span>
								</h1>
								<p className="text-base font-medium text-muted-foreground italic tracking-tight max-w-xl">
									The pulse of your campus, delivered without judgment. Discuss, debate, and discover what's truly happening.
								</p>
							</div>

							{/* Scope Switcher */}
							<div 
								className="inline-flex p-1.5 bg-card/60 backdrop-blur-md rounded-[2rem] border border-border/30 shadow-inner"
								role="radiogroup"
								aria-label="Discussion Scope"
							>
								{[
									{ id: "campus", label: "Local Campus", icon: Building2 },
									{ id: "universe", label: "Global Universe", icon: Globe2 }
								].map((scope) => (
									<button
										key={scope.id}
										role="radio"
										aria-checked={activeScope === scope.id}
										onClick={() => setActiveScope(scope.id as any)}
										className={cn(
											"relative flex items-center gap-2.5 px-6 py-2 rounded-[1.5rem] text-sm font-black italic tracking-tight transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
											activeScope === scope.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
										)}
									>
										{activeScope === scope.id && (
											<motion.div
												layoutId="activeScope"
												className="absolute inset-0 bg-primary rounded-[1.5rem] shadow-lg shadow-primary/20"
												transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
											/>
										)}
										<scope.icon className={cn("h-4 w-4 relative z-10 transition-transform", activeScope === scope.id && "scale-110")} />
										<span className="relative z-10">{scope.label}</span>
									</button>
								))}
							</div>
						</div>

						<div className="flex flex-col gap-4">
							<div 
								className="bg-card/60 backdrop-blur-xl border border-border/50 p-5 rounded-[2.5rem] shadow-xl"
								aria-live="polite"
							>
								<div className="flex items-center gap-3 mb-1 text-primary">
									<TrendingUp className="h-4 w-4" aria-hidden="true" />
									<span className="font-black italic tracking-widest text-[9px] uppercase">Live Pulse</span>
								</div>
								<div className="flex items-baseline gap-1">
									<span className="text-3xl font-black italic tracking-tighter" aria-label="1,200 active users">1.2k</span>
									<span className="text-[10px] font-black italic text-muted-foreground uppercase tracking-tight">Active Now</span>
								</div>
							</div>
						</div>
					</div>
				</motion.section>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 -mt-20 relative z-20">
					{/* Sidebar / Categories */}
					<nav className="lg:col-span-3 space-y-8" aria-label="Forum navigation">
						<div className="sticky top-20 space-y-6">
							<div className="space-y-4">
								<h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-4">Navigation</h3>
								<div className="flex flex-col gap-1.5" role="tablist">
									{tabs.map((tab) => (
										<button
											key={tab.id}
											role="tab"
											aria-selected={activeTab === tab.id}
											aria-controls={`panel-${tab.id}`}
											onClick={() => setActiveTab(tab.id)}
											className={cn(
												"flex items-center gap-3 px-6 py-4 rounded-2xl font-black italic tracking-tighter transition-all group relative outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
												activeTab === tab.id ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 translate-x-1" : "hover:bg-card/60 text-muted-foreground hover:text-foreground border border-transparent hover:border-border/30"
											)}
										>
											<tab.icon className={cn("h-5 w-5", activeTab === tab.id ? "text-white" : "group-hover:text-primary transition-colors")} aria-hidden="true" />
											<span className="text-lg">{tab.label}</span>
											{activeTab === tab.id && (
												<motion.div 
													layoutId="activeTabIndicator"
													className="absolute -left-1 top-4 bottom-4 w-1 bg-white rounded-full" 
												/>
											)}
										</button>
									))}
								</div>
							</div>

							<div className="p-6 rounded-[2rem] bg-gradient-to-br from-primary/5 to-secondary/5 border border-border/30">
								<h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Pro Tip</h4>
								<p className="text-xs font-medium text-muted-foreground italic leading-relaxed">
									The anonymous hash changes every 24 hours to ensure your identity remains untraceable even to server admins.
								</p>
							</div>
						</div>
					</nav>

					{/* Main Content */}
					<div className="lg:col-span-9 space-y-8">
						<AnonymousPostComposer 
							activeCategory={activeCategory} 
							activeScope={activeScope}
							refreshThreads={refreshThreads} 
						/>

						<div className="space-y-6">
							<AnimatePresence mode="wait">
								<motion.div
									key={activeTab + activeCategory + activeScope + refreshKey}
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -20 }}
									transition={{ duration: 0.3 }}
								>
									{activeTab === 'categories' ? (
										<ForumCategoryGrid activeId={activeCategory} onSelect={setActiveCategory} />
									) : (
										<ThreadList 
											activeCategory={activeCategory} 
											scope={activeScope} 
											sortBy={activeTab === 'trending' ? 'trending' : 'latest'}
											key={`${activeTab}-${refreshKey}-${activeCategory}-${activeScope}`} 
										/>
									)}
								</motion.div>
							</AnimatePresence>
						</div>
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}

function VenetianMask(props: any) {
	return (
		<svg
			{...props}
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d="M2.25 15C2.25 13.5 3 12 5.25 12C7.5 12 8.25 13.5 8.25 15C8.25 16.5 7.5 18 5.25 18C3 18 2.25 16.5 2.25 15Z" />
			<path d="M15.75 15C15.75 13.5 16.5 12 18.75 12C21 12 21.75 13.5 21.75 15C21.75 16.5 21 18 18.75 18C16.5 18 15.75 16.5 15.75 15Z" />
			<path d="M8.25 15H15.75" />
			<path d="M12 12V6C12 4.34315 13.3431 3 15 3H21" />
			<path d="M12 12V6C12 4.34315 10.6569 3 9 3H3" />
		</svg>
	);
}

