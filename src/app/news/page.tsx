'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NewsHero } from "@/components/news/NewsHero";
import { NewsCategoryList } from "@/components/news/NewsCategoryList";

import { useState } from "react";

export default function NewsPage() {
	const [activeCategory, setActiveCategory] = useState("all");

	return (
		<DashboardLayout
			title="Campus News"
			subtitle="Stay updated with the latest university announcements."
			breadcrumb={["UniVerse", "News"]}
		>
			<div className="max-w-6xl mx-auto pb-10 space-y-8">
				<NewsHero />
				<NewsCategoryList activeCategory={activeCategory} onSelect={setActiveCategory} />
			</div>
		</DashboardLayout>
	);
}
