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
			title={
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
						<MessageCircle className="h-6 w-6" />
					</div>
					<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
						Anonymous <span className="text-primary">Forums</span>
					</h1>
				</div>
			}
			subtitle="Speak freely, stay anonymous. Your identity is always protected."
			breadcrumb={["UniVerse", "Forums"]}
		>
			<div className="space-y-6">
				{/* Controls Row */}
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					{/* Scope Switcher */}
					<div
						className="inline-flex p-1 bg-muted/50 rounded-xl border border-border/50"
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
									"relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
									activeScope === scope.id
										? "text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								{activeScope === scope.id && (
									<motion.div
										layoutId="forumScope"
										className="absolute inset-0 bg-primary rounded-lg shadow-md"
										transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
									/>
								)}
								<scope.icon className="h-4 w-4 relative z-10" />
								<span className="relative z-10">{scope.label}</span>
							</button>
						))}
					</div>

					{/* Tab Switcher */}
					<div className="inline-flex p-1 bg-muted/50 rounded-xl border border-border/50">
						{tabs.map((tab) => (
							<button
								key={tab.id}
								role="tab"
								aria-selected={activeTab === tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={cn(
									"relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
									activeTab === tab.id
										? "text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								{activeTab === tab.id && (
									<motion.div
										layoutId="forumTab"
										className="absolute inset-0 bg-primary rounded-lg shadow-md"
										transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
									/>
								)}
								<tab.icon className="h-4 w-4 relative z-10" />
								<span className="relative z-10 hidden sm:inline">{tab.label}</span>
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
