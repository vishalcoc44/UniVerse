'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ForumCategoryGrid } from "@/components/forums/ForumCategoryGrid";
import { ThreadList } from "@/components/forums/ThreadList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { AnonymousPostComposer } from "@/components/forums/AnonymousPostComposer";
import { Flame, Clock, Grid2X2 } from "lucide-react";

export default function ForumsPage() {
	const [activeCategory, setActiveCategory] = useState("all");
	const [refreshKey, setRefreshKey] = useState(0);

	const refreshThreads = () => setRefreshKey(prev => prev + 1);

	return (
		<DashboardLayout
			title="Anonymous Forums"
			subtitle="Discuss campus life openly and securely."
			breadcrumb={["UniVerse", "Forums"]}
		>
			<div className="max-w-5xl mx-auto pb-10 space-y-8">
				<AnonymousPostComposer 
					activeCategory={activeCategory} 
					refreshThreads={refreshThreads} 
				/>

				<Tabs defaultValue="latest">
					<div className="flex items-center justify-between mb-6">
						<TabsList>
							<TabsTrigger value="latest" className="gap-2">
								<Clock className="h-4 w-4" />
								Latest
							</TabsTrigger>
							<TabsTrigger value="trending" className="gap-2">
								<Flame className="h-4 w-4" />
								Trending
							</TabsTrigger>
							<TabsTrigger value="categories" className="gap-2">
								<Grid2X2 className="h-4 w-4" />
								Categories
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value="latest">
						<ThreadList activeCategory={activeCategory} key={`latest-${refreshKey}-${activeCategory}`} />
					</TabsContent>

					<TabsContent value="trending">
						<ThreadList 
							activeCategory={activeCategory} 
							key={`trending-${refreshKey}-${activeCategory}`}
							sortBy="trending" 
						/>
					</TabsContent>

					<TabsContent value="categories">
						<ForumCategoryGrid activeId={activeCategory} onSelect={setActiveCategory} />
					</TabsContent>
				</Tabs>
			</div>
		</DashboardLayout>
	);
}

