'use client';

/**
 * News Model Differentiation:
 * News articles are stored as Post rows with category = 'NEWS'.
 * This distinguishes them from regular social feed posts (which use categories
 * like General, Academic, Social, etc.). Only ADMIN and FACULTY roles can
 * publish news articles; regular users see them read-only here.
 */

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NewsHero } from "@/components/news/NewsHero";
import { NewsCard, type NewsItem } from "@/components/news/NewsCard";
import { useUserUniversity } from "@/hooks/useUserUniversity";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Globe, Loader2, Search, School, Newspaper, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { useEffect, useMemo, useState, useCallback } from "react";

type PostRow = {
	id: string;
	content: string;
	mediaUrl: string | null;
	category: string | null;
	scope: "CAMPUS" | "UNIVERSE";
	createdAt: string;
	author: {
		id: string;
		fullName: string | null;
		avatarUrl: string | null;
	} | {
		id: string;
		fullName: string | null;
		avatarUrl: string | null;
	}[] | null;
};

export default function NewsPage() {
	const [activeScope, setActiveScope] = useState<"campus" | "universe">("campus");
	const [searchTerm, setSearchTerm] = useState("");
	const [loading, setLoading] = useState(true);
	const [errorText, setErrorText] = useState<string | null>(null);
	const [posts, setPosts] = useState<PostRow[]>([]);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [publishOpen, setPublishOpen] = useState(false);
	const [publishContent, setPublishContent] = useState("");
	const [publishImageUrl, setPublishImageUrl] = useState("");
	const [publishing, setPublishing] = useState(false);
	const { universityId, loading: uniLoading, userId, role } = useUserUniversity();

	const canPublish = role === 'ADMIN' || role === 'FACULTY';

	const getErrorMessage = (error: any) => error?.message || error?.details || error?.hint || "Unknown error";

	const fetchNews = useCallback(async () => {
		if (uniLoading) return;
		setLoading(true);
		setErrorText(null);

		let query = supabase
			.from('Post')
			.select('id,content,mediaUrl,category,scope,createdAt,author:Profile(id,fullName,avatarUrl)')
			.eq('category', 'NEWS')
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
	}, [activeScope, searchTerm, universityId, uniLoading]);

	useEffect(() => {
		if (uniLoading) return;
		if (userId) setCurrentUserId(userId);
		fetchNews();
	}, [fetchNews, uniLoading, userId]);

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
			authorId: Array.isArray(post.author) ? post.author[0]?.id : post.author?.id,
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

	const handleDeletePost = async (id: string) => {
		try {
			const { error } = await supabase.from('Post').delete().eq('id', id);
			if (error) throw error;
			setPosts((prev) => prev.filter((p) => p.id !== id));
			toast.success("News post deleted.");
		} catch (error: any) {
			toast.error(`Failed to delete post: ${getErrorMessage(error)}`);
		}
	};

	const handlePublishNews = async () => {
		if (!publishContent.trim()) {
			toast.error("News content cannot be empty.");
			return;
		}
		if (!userId || !universityId) {
			toast.error("You must be logged in with a university profile.");
			return;
		}

		setPublishing(true);
		try {
			const { error } = await supabase.from('Post').insert({
				id: crypto.randomUUID(),
				content: publishContent.trim(),
				mediaUrl: publishImageUrl.trim() || null,
				category: 'NEWS',
				scope: activeScope === 'universe' ? 'UNIVERSE' : 'CAMPUS',
				universityId,
				authorId: userId,
			});
			if (error) throw error;

			toast.success("News article published!");
			setPublishContent("");
			setPublishImageUrl("");
			setPublishOpen(false);
			fetchNews();
		} catch (error: any) {
			toast.error(`Failed to publish: ${getErrorMessage(error)}`);
		} finally {
			setPublishing(false);
		}
	};

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
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<Tabs value={activeScope} onValueChange={(value) => setActiveScope(value as "campus" | "universe")}>
						<TabsList className="grid grid-cols-2 w-full max-w-sm">
							<TabsTrigger value="campus" className="gap-2"><School className="h-4 w-4" /> Campus</TabsTrigger>
							<TabsTrigger value="universe" className="gap-2"><Globe className="h-4 w-4" /> Universe</TabsTrigger>
						</TabsList>
					</Tabs>

					{canPublish && (
						<Dialog open={publishOpen} onOpenChange={setPublishOpen}>
							<DialogTrigger asChild>
								<Button className="gap-2">
									<Plus className="h-4 w-4" /> Publish News
								</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-lg">
								<DialogHeader>
									<DialogTitle>Publish News Article</DialogTitle>
								</DialogHeader>
								<div className="space-y-4 py-2">
									<Textarea
										placeholder="Write the news article content..."
										value={publishContent}
										onChange={(e) => setPublishContent(e.target.value)}
										rows={6}
										className="resize-none"
									/>
									<Input
										placeholder="Image URL (optional)"
										value={publishImageUrl}
										onChange={(e) => setPublishImageUrl(e.target.value)}
									/>
									<p className="text-xs text-muted-foreground">
										This will be published as a <strong>NEWS</strong> post visible on the {activeScope === 'campus' ? 'campus' : 'universe'} feed.
									</p>
								</div>
								<DialogFooter>
									<DialogClose asChild>
										<Button variant="outline">Cancel</Button>
									</DialogClose>
									<Button onClick={handlePublishNews} disabled={publishing || !publishContent.trim()}>
										{publishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
										{publishing ? "Publishing..." : "Publish"}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					)}
				</div>

				<div className="relative max-w-xl">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search news by keywords..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-9"
					/>
				</div>

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
									<NewsCard
										key={item.id}
										news={item}
										isAuthor={currentUserId === (item as any).authorId}
										onDelete={handleDeletePost}
									/>
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
