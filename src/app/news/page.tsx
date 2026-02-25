'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NewsHero } from "@/components/news/NewsHero";
import { NewsCategoryList } from "@/components/news/NewsCategoryList";
import { NewsCard, type NewsItem } from "@/components/news/NewsCard";
import { useUserUniversity } from "@/hooks/useUserUniversity";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Loader2, Search, School, Newspaper } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { useEffect, useMemo, useState } from "react";

type PostRow = {
	id: string;
	content: string;
	mediaUrl: string | null;
	category: string | null;
	scope: "CAMPUS" | "UNIVERSE";
	createdAt: string;
	author: {
		fullName: string | null;
		avatarUrl: string | null;
	} | {
		fullName: string | null;
		avatarUrl: string | null;
	}[] | null;
};

export default function NewsPage() {
	const [activeScope, setActiveScope] = useState<"campus" | "universe">("campus");
	const [activeCategory, setActiveCategory] = useState("all");
	const [searchTerm, setSearchTerm] = useState("");
	const [loading, setLoading] = useState(true);
	const [errorText, setErrorText] = useState<string | null>(null);
	const [posts, setPosts] = useState<PostRow[]>([]);
	const { universityId, loading: uniLoading } = useUserUniversity();

	const getErrorMessage = (error: any) => error?.message || error?.details || error?.hint || "Unknown error";

	useEffect(() => {
		if (uniLoading) return;

		const fetchNews = async () => {
			setLoading(true);
			setErrorText(null);

			let query = supabase
				.from('Post')
				.select('id,content,mediaUrl,category,scope,createdAt,author:Profile(fullName,avatarUrl)')
				.order('createdAt', { ascending: false })
				.limit(30);

			if (activeScope === 'campus') {
				if (!universityId) {
					setPosts([]);
					setLoading(false);
					return;
				}
				query = query.eq('scope', 'CAMPUS').eq('universityId', universityId);
			} else {
				query = query.eq('scope', 'UNIVERSE');
			}

			if (activeCategory !== 'all') {
				query = query.eq('category', activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1));
			}

			if (searchTerm.trim()) {
				query = query.ilike('content', `%${searchTerm.trim()}%`);
			}

			const { data, error } = await query;
			if (error) {
				const message = getErrorMessage(error);
				setErrorText(message);
				toast.error(`Failed to load campus news: ${message}`);
				setPosts([]);
			} else {
				setPosts((data || []) as unknown as PostRow[]);
			}

			setLoading(false);
		};

		fetchNews();
	}, [activeScope, activeCategory, searchTerm, universityId, uniLoading]);

	const formatPostTitle = (content: string) => {
		const clean = content.replace(/\s+/g, ' ').trim();
		if (!clean) return "Untitled campus update";
		if (clean.length <= 72) return clean;
		return `${clean.slice(0, 72).trim()}...`;
	};

	const formatPostExcerpt = (content: string) => {
		const clean = content.replace(/\s+/g, ' ').trim();
		if (clean.length <= 140) return clean;
		return `${clean.slice(0, 140).trim()}...`;
	};

	const estimateReadTime = (content: string) => {
		const words = content.trim().split(/\s+/).filter(Boolean).length;
		const mins = Math.max(1, Math.ceil(words / 220));
		return `${mins} min read`;
	};

	const mappedNews = useMemo<NewsItem[]>(() => {
		return posts.map((post) => ({
			id: post.id,
			title: formatPostTitle(post.content),
			excerpt: formatPostExcerpt(post.content),
			category: post.category || "General",
			image: post.mediaUrl,
			author: {
				name: (Array.isArray(post.author) ? post.author[0]?.fullName : post.author?.fullName) || "UniVerse",
				avatar: (Array.isArray(post.author) ? post.author[0]?.avatarUrl : post.author?.avatarUrl) || null,
			},
			date: formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }),
			readTime: estimateReadTime(post.content),
		}));
	}, [posts]);

	const featured = mappedNews[0] || null;
	const remaining = mappedNews.slice(1);

	return (
		<DashboardLayout
			title={
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
						<Newspaper className="h-6 w-6" />
					</div>
					<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
						Campus <span className="text-primary">News</span>
					</h1>
				</div>
			}
			subtitle="Stay updated with the latest university announcements."
			breadcrumb={["UniVerse", "News"]}
		>
			<div className="max-w-6xl mx-auto pb-10 space-y-8">
				<Tabs value={activeScope} onValueChange={(value) => setActiveScope(value as "campus" | "universe")}>
					<TabsList className="grid grid-cols-2 w-full max-w-sm">
						<TabsTrigger value="campus" className="gap-2"><School className="h-4 w-4" /> Campus</TabsTrigger>
						<TabsTrigger value="universe" className="gap-2"><Globe className="h-4 w-4" /> Universe</TabsTrigger>
					</TabsList>
				</Tabs>

				<div className="relative max-w-xl">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search news by keywords..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-9"
					/>
				</div>

				<NewsCategoryList activeCategory={activeCategory} onSelect={setActiveCategory} />

				{loading ? (
					<div className="p-12 text-center">
						<Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
					</div>
				) : errorText ? (
					<div className="p-12 text-center text-destructive">Failed to load news: {errorText}</div>
				) : mappedNews.length === 0 ? (
					<div className="p-12 text-center text-muted-foreground">No news posts found for current filters.</div>
				) : (
					<>
						<NewsHero
							featured={featured ? {
								title: featured.title,
								excerpt: featured.excerpt,
								category: featured.category,
								date: featured.date,
								readTime: featured.readTime,
								image: featured.image,
							} : null}
						/>

						{remaining.length > 0 ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{remaining.map((item) => (
									<NewsCard key={item.id} news={item} />
								))}
							</div>
						) : (
							<div className="text-center text-muted-foreground">Only one story matches your filters right now.</div>
						)}
					</>
				)}
			</div>
		</DashboardLayout>
	);
}
