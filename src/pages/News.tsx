import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NewsHero } from "@/components/news/NewsHero";
import { NewsCategoryList } from "@/components/news/NewsCategoryList";
import { NewsCard, NewsItem } from "@/components/news/NewsCard";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

const mockNews: NewsItem[] = [
	{
		id: "1",
		title: "New Research Center for AI Ethics Opens on Campus",
		excerpt: "The interdisciplinary center will focus on the societal implications of artificial intelligence systems.",
		category: "Academics",
		image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070&auto=format&fit=crop",
		author: { name: "Dr. Sarah Chen", avatar: "https://i.pravatar.cc/150?u=s" },
		date: "Oct 24, 2025",
		readTime: "6 min read"
	},
	{
		id: "2",
		title: "Varsity Basketball Team Secures Championship Spot",
		excerpt: "In a thrilling match against State, our team clinched the victory in the final seconds.",
		category: "Sports",
		image: "https://images.unsplash.com/photo-1546519638-68e109498ee2?q=80&w=2070&auto=format&fit=crop",
		author: { name: "Mike Ross", avatar: "https://i.pravatar.cc/150?u=m" },
		date: "Oct 23, 2025",
		readTime: "3 min read"
	},
	{
		id: "3",
		title: "Campus Library Extends Hours for Finals Week",
		excerpt: "24/7 access will be available starting next Monday to support students during exam preparation.",
		category: "Administration",
		image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=2070&auto=format&fit=crop",
		author: { name: "Admin Office", avatar: "" },
		date: "Oct 22, 2025",
		readTime: "1 min read"
	},
	{
		id: "4",
		title: "Annual Cultural Night: Call for Performers",
		excerpt: "Sign-ups are now open for dancers, musicians, and actors. Show your talent on the big stage!",
		category: "Art & Culture",
		image: "https://images.unsplash.com/photo-1514525253440-b393452e27ab?q=80&w=2074&auto=format&fit=crop",
		author: { name: "Cultural Club", avatar: "https://i.pravatar.cc/150?u=c" },
		date: "Oct 20, 2025",
		readTime: "2 min read"
	}
];

const News = () => {
	const [activeCategory, setActiveCategory] = useState("all");

	return (
		<DashboardLayout
			title="Campus News"
			subtitle="Stay updated with the latest headlines."
			breadcrumb={["UniVerse", "News"]}
		>
			<div className="max-w-6xl mx-auto space-y-10 pb-10">
				{/* Hero Section */}
				<NewsHero />

				{/* Categories & Filter */}
				<div className="space-y-6">
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
						<h2 className="text-2xl font-bold tracking-tight">Latest Stories</h2>
						<NewsCategoryList activeCategory={activeCategory} onSelect={setActiveCategory} />
					</div>

					{/* News Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{mockNews.map((news) => (
							<NewsCard key={news.id} news={news} />
						))}
					</div>
				</div>

				{/* Newsletter Subscription */}
				<div className="bg-primary/5 border border-primary/10 rounded-2xl p-8 md:p-12 text-center space-y-4">
					<div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-2">
						<Mail className="h-6 w-6 text-primary" />
					</div>
					<h3 className="text-2xl font-bold">Never Miss a Beat</h3>
					<p className="text-muted-foreground max-w-lg mx-auto">
						Get the top stories and campus announcements delivered weekly to your inbox.
					</p>
					<div className="flex max-w-sm mx-auto gap-2">
						<Input placeholder="Enter your email" className="bg-background" />
						<Button>Subscribe</Button>
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
};

export default News;
