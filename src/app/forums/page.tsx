'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ForumCategoryGrid } from "@/components/forums/ForumCategoryGrid";
import { ThreadList } from "@/components/forums/ThreadList";
import { useState } from "react";
import { AnonymousPostComposer } from "@/components/forums/AnonymousPostComposer";
import { Clock, Grid2X2, Globe2, Building2, MessageCircle, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ForumsPage() {
	const [activeCategory, setActiveCategory] = useState("general");
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
			icon={MessageCircle}
			title={<>Anonymous <span className="text-primary">Forums</span></>}
			subtitle="Speak freely, stay anonymous. Your identity is always protected."
			breadcrumb={["UniVerse", "Forums"]}
		>
			<div className="max-w-5xl mx-auto space-y-6">
				{/* Controls Row */}
				<div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card/30 backdrop-blur-md p-2 rounded-2xl border border-border/50">
					{/* Tab Switcher */}
					<div className="flex p-1 bg-muted/30 rounded-xl overflow-x-auto no-scrollbar">
						{tabs.map((tab) => (
							<button
								key={tab.id}
								role="tab"
								aria-selected={activeTab === tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={cn(
									"relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight transition-all shrink-0",
									activeTab === tab.id
										? "text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								{activeTab === tab.id && (
									<motion.div
										layoutId="forumTab"
										className="absolute inset-0 bg-primary rounded-lg shadow-sm"
										transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
									/>
								)}
								<tab.icon className="h-3.5 w-3.5 relative z-10" />
								<span className="relative z-10">{tab.label}</span>
							</button>
						))}
					</div>

					{/* Scope Switcher */}
					<div
						className="flex p-1 bg-muted/30 rounded-xl"
						role="radiogroup"
						aria-label="Discussion Scope"
					>
						{[
							{ id: "campus", label: "Campus", icon: Building2 },
							{ id: "universe", label: "Universe", icon: Globe2 }
						].map((scope) => (
							<button
								key={scope.id}
								role="radio"
								aria-checked={activeScope === scope.id}
								onClick={() => setActiveScope(scope.id as any)}
								className={cn(
									"relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight transition-all",
									activeScope === scope.id
										? "text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								{activeScope === scope.id && (
									<motion.div
										layoutId="forumScope"
										className="absolute inset-0 bg-primary rounded-lg shadow-sm"
										transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
									/>
								)}
								<scope.icon className="h-3.5 w-3.5 relative z-10" />
								<span className="relative z-10">{scope.label}</span>
							</button>
						))}
					</div>
				</div>

				{/* Post Composer */}
				<AnonymousPostComposer
					activeCategory={activeCategory}
					activeScope={activeScope}
					refreshThreads={refreshThreads}
				/>

				{/* Thread Content */}
				<AnimatePresence mode="wait">
					<motion.div
						key={activeTab + activeCategory + activeScope + refreshKey}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.2 }}
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
		</DashboardLayout>
	);
}
