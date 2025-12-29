'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ForumCategoryGrid } from "@/components/forums/ForumCategoryGrid";
import { ThreadList } from "@/components/forums/ThreadList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

// Add state for category selection
export default function ForumsPage() {
	const [activeCategory, setActiveCategory] = useState("all");

	return (
		<DashboardLayout
			title="Anonymous Forums"
			subtitle="Discuss campus life openly and securely."
			breadcrumb={["UniVerse", "Forums"]}
		>
			<div className="max-w-5xl mx-auto pb-10 space-y-8">
				<Tabs defaultValue="latest">
					<div className="flex items-center justify-between mb-6">
						<TabsList>
							<TabsTrigger value="latest">Latest Threads</TabsTrigger>
							<TabsTrigger value="categories">Categories</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value="latest">
						<ThreadList />
					</TabsContent>

					<TabsContent value="categories">
						<ForumCategoryGrid activeId={activeCategory} onSelect={setActiveCategory} />
					</TabsContent>
				</Tabs>
			</div>
		</DashboardLayout>
	);
}
