'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SharePostBox } from "@/components/feed/SharePostBox";
import { PostCard } from "@/components/feed/PostCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Globe, School, Loader2, Sparkles, UserPlus, Bookmark as BookmarkIcon, MessageCircle, Activity, TrendingUp, X as XIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { CommentModal } from "@/components/feed/CommentModal";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUserUniversity } from "@/hooks/useUserUniversity";

const PAGE_SIZE = 25;

export default function Feed() {
	const [posts, setPosts] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [activeTab, setActiveTab] = useState("campus");
	const { universityId, loading: uniLoading } = useUserUniversity();
	const [currentUser, setCurrentUser] = useState<any>(null);

	// Interaction states
	const [commentPostId, setCommentPostId] = useState<string | null>(null);
	const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
	const [postIdToDelete, setPostIdToDelete] = useState<string | null>(null);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);

	// Feature states
	const [peopleSuggestions, setPeopleSuggestions] = useState<any[]>([]);
	const [bannerdismissed, setBannerDismissed] = useState(false);
	const [pinnedAnnouncement, setPinnedAnnouncement] = useState<string | null>(null);
	const [globalTrendingTags, setGlobalTrendingTags] = useState<{ tag: string; count: number }[]>([]);

	const categories = ["Academic", "Events", "Social", "Marketplace", "Career", "General"];

	useEffect(() => {
		supabase.auth.getUser().then(({ data: { user } }) => {
			if (user) setCurrentUser(user);
		});
		const dismissed = sessionStorage.getItem('feed_banner_dismissed');
		if (dismissed) setBannerDismissed(true);
	}, []);

	const fetchPosts = async (pageNum = 0, append = false) => {
		if (append) { setLoadingMore(true); } else { setLoading(true); }
		const from = pageNum * PAGE_SIZE;
		const to = from + PAGE_SIZE - 1;

		let query = supabase
			.from('Post')
			.select(`
				*,
				author:Profile!authorId(id, fullName, avatarUrl, username, role),
				likes:Like(count),
				comments:Comment(count),
				reactions:PostReaction(id, emoji, userId),
				poll:PostPoll(*, options:PostPollOption(*)),
				quotedPost:Post!quotedPostId(*)
			`)
			.order('createdAt', { ascending: false })
			.range(from, to);

		if (selectedCategory) query = query.eq('category', selectedCategory);

		if (activeTab === 'campus') {
			if (universityId) {
				query = query.eq('scope', 'CAMPUS').eq('universityId', universityId);
			} else {
				if (!uniLoading && !universityId) { setPosts([]); setLoading(false); return; }
			}
		} else if (activeTab === 'universe') {
			query = query.eq('scope', 'UNIVERSE');
		} else if (activeTab === 'bookmarks') {
			const { data: { user } } = await supabase.auth.getUser();
			if (user) {
				const { data: bookmarks } = await supabase.from('Bookmark').select('postId').eq('userId', user.id);
				const ids = bookmarks?.map((b: any) => b.postId) || [];
				if (ids.length > 0) {
					query = supabase.from('Post').select(`
						*,
						author:Profile!authorId(id, fullName, avatarUrl, username, role),
						likes:Like(count),
						comments:Comment(count),
						reactions:PostReaction(id, emoji, userId),
						poll:PostPoll(*, options:PostPollOption(*)),
						quotedPost:Post!quotedPostId(*)
					`).in('id', ids).order('createdAt', { ascending: false }).range(from, to);
				} else { setPosts([]); setLoading(false); return; }
			} else { setPosts([]); setLoading(false); return; }
		}

		const { data, error } = await query;
		const { data: { user } } = await supabase.auth.getUser();

		if (error) {
			console.error('Error fetching posts:', error?.message || error?.code || JSON.stringify(error));
		} else {
			setHasMore((data?.length ?? 0) === PAGE_SIZE);

			let likedPostIds = new Set<string>();
			let bookmarkedPostIds = new Set<string>();

			if (user && data && data.length > 0) {
				const postIds = data.map((p: any) => p.id);
				const [myLikes, myBookmarks] = await Promise.all([
					supabase.from('Like').select('postId').eq('userId', user.id).in('postId', postIds),
					supabase.from('Bookmark').select('postId').eq('userId', user.id).in('postId', postIds)
				]);
				if (myLikes.data) likedPostIds = new Set(myLikes.data.map((l: any) => l.postId));
				if (myBookmarks.data) bookmarkedPostIds = new Set(myBookmarks.data.map((b: any) => b.postId));
			}

			const mappedPosts = data?.map((post: any) => {
				const raw = post.createdAt;
				const dateStr = raw.includes('+') || raw.endsWith('Z') ? raw : (raw.includes('T') ? raw : raw.replace(' ', 'T')) + 'Z';

				const reactionMap: Record<string, { count: number; userReacted: boolean }> = {};
				(post.reactions || []).forEach((r: any) => {
					if (!reactionMap[r.emoji]) reactionMap[r.emoji] = { count: 0, userReacted: false };
					reactionMap[r.emoji].count++;
					if (r.userId === user?.id) reactionMap[r.emoji].userReacted = true;
				});
				const reactions = Object.entries(reactionMap).map(([emoji, data]) => ({ emoji, ...data }));

				return {
					id: post.id,
					author: {
						id: post.authorId,
						name: post.author?.fullName || "Unknown",
						handle: post.author?.username || "anon",
						avatar: post.author?.avatarUrl || "https://github.com/shadcn.png",
						role: post.author?.role || "Student"
					},
					content: post.content,
					image: post.mediaUrl,
					timestamp: formatDistanceToNow(new Date(dateStr), { addSuffix: true }),
					stats: { likes: post.likes?.[0]?.count || 0, comments: post.comments?.[0]?.count || 0, shares: 0 },
					tags: [],
					scope: post.scope?.toLowerCase() || 'campus',
					isLiked: likedPostIds.has(post.id),
					isBookmarked: bookmarkedPostIds.has(post.id),
					currentUserId: user?.id,
					currentUserRole: currentUser?.role,
					category: post.category,
					viewCount: post.viewCount || 0,
					reactions,
					isPinned: post.isPinned || false,
					poll: post.poll?.[0] || null,
					quotedPost: Array.isArray(post.quotedPost) ? post.quotedPost[0] : (post.quotedPost || null),
				};
			}) || [];

			if (append) {
				setPosts(prev => [...prev, ...mappedPosts]);
			} else {
				setPosts(mappedPosts);
			}
		}
		setLoading(false);
		setLoadingMore(false);
	};

	const loadMore = () => {
		const nextPage = page + 1;
		setPage(nextPage);
		fetchPosts(nextPage, true);
	};

	const fetchTrendingTags = async () => {
		const { data } = await supabase.from('Post').select('content').order('createdAt', { ascending: false }).limit(200);
		if (data) {
			const freq: Record<string, number> = {};
			data.forEach(p => {
				const matches = p.content?.match(/#[a-z0-9_]+/gi) || [];
				matches.forEach((tag: string) => { freq[tag.toLowerCase()] = (freq[tag.toLowerCase()] || 0) + 1; });
			});
			const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag, count]) => ({ tag, count }));
			setGlobalTrendingTags(sorted);
		}
	};

	useEffect(() => {
		fetchTrendingTags();
	}, []);

	// Fetch real people suggestions
	const fetchSuggestions = async () => {
		if (!universityId || !currentUser) return;
		const { data: existing } = await supabase.from('Friendship').select('addresseeId, requesterId').or(`requesterId.eq.${currentUser.id},addresseeId.eq.${currentUser.id}`);
		const connectedIds = new Set<string>([currentUser.id]);
		existing?.forEach((f: any) => { connectedIds.add(f.addresseeId); connectedIds.add(f.requesterId); });

		const { data: people } = await supabase.from('Profile').select('id, fullName, avatarUrl, username, department, role').eq('universityId', universityId).not('id', 'in', `(${Array.from(connectedIds).join(',')})`).limit(4);
		if (people) setPeopleSuggestions(people);
	};

	useEffect(() => {
		setPage(0);
		setHasMore(true);
		if (!uniLoading) fetchPosts(0, false);
		const channel = supabase.channel('public:Post').on('postgres_changes', { event: '*', schema: 'public', table: 'Post' }, () => {
			setPage(0);
			setHasMore(true);
			fetchPosts(0, false);
			fetchTrendingTags();
		}).subscribe();
		return () => { supabase.removeChannel(channel); };
	}, [activeTab, universityId, uniLoading, selectedCategory]);

	useEffect(() => {
		if (currentUser && universityId) fetchSuggestions();
	}, [currentUser, universityId]);

	// Live trending hashtags
	const trendingTags = useMemo(() => {
		const freq: Record<string, number> = {};
		posts.forEach(p => {
			const matches = p.content?.match(/#[a-z0-9_]+/gi) || [];
			matches.forEach((tag: string) => { freq[tag.toLowerCase()] = (freq[tag.toLowerCase()] || 0) + 1; });
		});
		return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag, count]) => ({ tag, count }));
	}, [posts]);

	const filteredPosts = useMemo(() => {
		if (!selectedHashtag) return posts;
		return posts.filter(p => p.content?.toLowerCase().includes(selectedHashtag.toLowerCase()));
	}, [posts, selectedHashtag]);

	const handleLike = async (postId: string) => {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return;
		setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: !p.isLiked, stats: { ...p.stats, likes: p.isLiked ? p.stats.likes - 1 : p.stats.likes + 1 } } : p));
		const post = posts.find(p => p.id === postId);
		if (!post) return;
		try {
			if (post.isLiked) {
				await supabase.from('Like').delete().eq('postId', postId).eq('userId', user.id);
			} else {
				await supabase.from('Like').insert({ id: crypto.randomUUID(), postId, userId: user.id });
			}
		} catch { fetchPosts(); }
	};

	const handleBookmark = async (postId: string) => {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return;
		setPosts(prev => prev.map(p => p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p));
		const post = posts.find(p => p.id === postId);
		if (!post) return;
		try {
			if (post.isBookmarked) {
				await supabase.from('Bookmark').delete().eq('postId', postId).eq('userId', user.id);
				if (activeTab === 'bookmarks') setPosts(prev => prev.filter(p => p.id !== postId));
			} else {
				await supabase.from('Bookmark').insert({ id: crypto.randomUUID(), postId, userId: user.id });
			}
		} catch { fetchPosts(); }
	};

	const handleReact = async (postId: string, emoji: string) => {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return;
		try {
			const existing = await supabase.from('PostReaction').select('id').eq('postId', postId).eq('userId', user.id).single();
			if (existing.data) {
				await supabase.from('PostReaction').delete().eq('id', existing.data.id);
			}
			await supabase.from('PostReaction').insert({ id: crypto.randomUUID(), postId, userId: user.id, emoji });
			fetchPosts();
		} catch { fetchPosts(); }
	};

	const handleRepost = async (quotedPostId: string, quoteText: string) => {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) { toast.error("Please login."); return; }
		const { data: profile } = await supabase.from('Profile').select('universityId').eq('id', user.id).single();
		const { error } = await supabase.from('Post').insert({
			id: crypto.randomUUID(), content: quoteText || "🔁 Reposted",
			scope: activeTab === 'campus' ? 'CAMPUS' : 'UNIVERSE',
			universityId: profile?.universityId || null, authorId: user.id,
			type: 'TEXT', category: 'General', quotedPostId,
			updatedAt: new Date().toISOString()
		});
		if (error) toast.error("Failed to repost"); else toast.success("Reposted!"); fetchPosts();
	};

	const handleComment = (postId: string) => {
		// Increment view count when opening post thread
		if (currentUser) {
			supabase
				.from('Post')
				.select('viewCount')
				.eq('id', postId)
				.single()
				.then(({ data }) => {
					const nextViewCount = (data?.viewCount ?? 0) + 1;
					return supabase
						.from('Post')
						.update({ viewCount: nextViewCount })
						.eq('id', postId);
				})
				.then(() => { });
		}
		setCommentPostId(postId); setIsCommentModalOpen(true);
	};

	const handleDeleteClick = (postId: string) => { setPostIdToDelete(postId); setIsDeleteDialogOpen(true); };

	const confirmDelete = async () => {
		if (!postIdToDelete) return;
		const id = postIdToDelete;
		setPostIdToDelete(null); setIsDeleteDialogOpen(false);
		setPosts(prev => prev.filter(p => p.id !== id));
		try {
			const { error } = await supabase.from('Post').delete().eq('id', id);
			if (error) throw error;
			toast.success("Post deleted successfully");
		} catch { toast.error("Failed to delete post"); fetchPosts(); }
	};

	const handlePin = async (postId: string, isPinned: boolean) => {
		setPosts(prev => prev.map(p => p.id === postId ? { ...p, isPinned } : p));
		try {
			await supabase.from('Post').update({ isPinned }).eq('id', postId);
		} catch { fetchPosts(); }
	};

	const handleConnect = async (userId: string) => {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return;
		try {
			const { error } = await supabase.from('Friendship').insert({ requesterId: user.id, addresseeId: userId });
			if (error?.code === '23505') { toast.info("Request already sent."); } else if (error) throw error;
			else { toast.success("Friend request sent!"); setPeopleSuggestions(prev => prev.filter(p => p.id !== userId)); }
		} catch { toast.error("Failed to send request."); }
	};

	const dismissBanner = () => {
		setBannerDismissed(true);
		sessionStorage.setItem('feed_banner_dismissed', '1');
	};

	const pinnedPost = useMemo(() => posts.find(p => p.isPinned), [posts]);

	return (
		<DashboardLayout
			title={
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
						<Activity className="h-6 w-6" />
					</div>
					<h1 className="text-3xl md:text-4xl font-bold tracking-tight">Social <span className="text-primary">Feed</span></h1>
				</div>
			}
			subtitle="Connect with your campus and the universe."
			breadcrumb={["UniVerse", "Feed"]}
		>
			<div className="flex flex-col lg:flex-row gap-4 lg:gap-8 max-w-6xl mx-auto w-full pb-20">
				{/* Main Content Area */}
				<div className="flex-1 min-w-0">
					{/* Pinned Announcement Banner */}
					{!bannerdismissed && activeTab === 'campus' && (
						<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/20 rounded-2xl px-5 py-3 flex items-center justify-between gap-3">
							<div className="flex items-center gap-3">
								<span className="text-lg">📌</span>
								<div className="text-sm font-semibold">
									<span className="text-primary font-black uppercase text-[10px] tracking-widest block mb-0.5">Pinned {pinnedPost?.author.id === currentUser?.id ? 'by you' : 'Announcement'}</span>
									<p className="line-clamp-1 italic">
										{pinnedPost?.content || "Stay tuned for upcoming events and announcements from your student council this semester."}
									</p>
								</div>
							</div>
							<button onClick={dismissBanner} className="text-muted-foreground hover:text-foreground shrink-0">
								<XIcon className="h-4 w-4" />
							</button>
						</motion.div>
					)}

					<div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md pb-4 pt-2 -mt-2">
						<Tabs defaultValue="campus" value={activeTab} onValueChange={setActiveTab} className="w-full">
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
								<TabsList className="grid w-full sm:w-[320px] grid-cols-3 bg-card/60 backdrop-blur-sm border border-border/50 rounded-[1.25rem] p-1 h-11">
									<TabsTrigger value="campus" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300">
										<School className="w-3.5 h-3.5 mr-1.5" /> Campus
									</TabsTrigger>
									<TabsTrigger value="universe" className="rounded-xl data-[state=active]:bg-violet-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">
										<Globe className="w-3.5 h-3.5 mr-1.5" /> Universe
									</TabsTrigger>
									<TabsTrigger value="bookmarks" className="rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">
										<BookmarkIcon className="w-3.5 h-3.5 mr-1.5" /> Saved
									</TabsTrigger>
								</TabsList>

								<div className="hidden xl:flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
									<Badge variant={selectedCategory === null ? "default" : "outline"} className={cn("cursor-pointer px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-all", selectedCategory === null ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted/50")} onClick={() => setSelectedCategory(null)}>Recent</Badge>
									{categories.slice(0, 3).map((cat) => (
										<Badge key={cat} variant={selectedCategory === cat ? "default" : "outline"} className={cn("cursor-pointer px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-all", selectedCategory === cat ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted/50")} onClick={() => setSelectedCategory(cat)}>{cat}</Badge>
									))}
								</div>
							</div>
						</Tabs>
					</div>

					<div className="mt-6">
						{activeTab !== 'bookmarks' && (
							<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
								<SharePostBox onPostCreated={() => { setPage(0); setHasMore(true); fetchPosts(0, false); }} />
							</motion.div>
						)}

						{/* Hashtag active filter indicator */}
						{selectedHashtag && (
							<div className="flex items-center gap-2 mb-4">
								<Badge className="bg-primary/10 text-primary border-primary/30 gap-2">
									{selectedHashtag}
									<button onClick={() => setSelectedHashtag(null)}><XIcon className="h-3 w-3" /></button>
								</Badge>
								<span className="text-xs text-muted-foreground">{filteredPosts.length} posts</span>
							</div>
						)}

						{/* Mobile Category Filter */}
						<div className="flex xl:hidden gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
							<button onClick={() => setSelectedCategory(null)} className={cn("px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap", selectedCategory === null ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" : "bg-card/60 backdrop-blur-sm border border-border/50 text-muted-foreground hover:bg-muted/50")}>All Feed</button>
							{categories.map((cat) => (
								<button key={cat} onClick={() => setSelectedCategory(cat)} className={cn("px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap", selectedCategory === cat ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" : "bg-card/60 backdrop-blur-sm border border-border/50 text-muted-foreground hover:bg-muted/50")}>{cat}</button>
							))}
						</div>

						<div className="space-y-4">
							{loading ? (
								<div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
									<Loader2 className="h-10 w-10 animate-spin text-primary" />
									<p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Gathering your universe...</p>
								</div>
							) : filteredPosts.length === 0 ? (
								<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 bg-card/20 rounded-[3rem] border-2 border-dashed border-border/50">
									<p className="text-muted-foreground italic">No posts found in this section yet.</p>
								</motion.div>
							) : (
								<>
									{filteredPosts.map((post, idx) => (
										<motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(idx, 10) * 0.04 }}>
											<PostCard
												{...post}
												onLike={handleLike}
												onBookmark={handleBookmark}
												onDelete={handleDeleteClick}
												onComment={handleComment}
												onConnect={handleConnect}
												onReact={handleReact}
												onRepost={handleRepost}
												onHashtagClick={(tag) => { setSelectedHashtag(selectedHashtag === tag ? null : tag); }}
												onPollVoted={() => fetchPosts(0, false)}
												isPinned={post.isPinned}
												onPin={handlePin}
											/>
										</motion.div>
									))}
									{hasMore && !selectedHashtag && (
										<div className="flex justify-center pt-4">
											<Button
												variant="outline"
												onClick={loadMore}
												disabled={loadingMore}
												className="rounded-full px-8"
											>
												{loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
												Load More
											</Button>
										</div>
									)}
								</>
							)}
						</div>
					</div>
				</div>

				{/* Right Sidebar */}
				<div className="hidden lg:block w-[300px] space-y-6">
					{/* Trending Hashtags (Live) */}
					<div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-[2.5rem] p-6 sticky top-6">
						<div className="flex items-center gap-2 mb-5">
							<TrendingUp className="h-5 w-5 text-amber-500" />
							<h3 className="font-black text-xl italic tracking-tight">Trending</h3>
						</div>

						{globalTrendingTags.length > 0 ? (
							<div className="space-y-4">
								{globalTrendingTags.map(({ tag, count }, i) => (
									<button key={tag} onClick={() => setSelectedHashtag(selectedHashtag === tag ? null : tag)} className={cn("w-full text-left group cursor-pointer rounded-xl p-2 -mx-2 transition-all hover:bg-muted/30", selectedHashtag === tag && "bg-primary/5")}>
										<p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Trending #{i + 1}</p>
										<h4 className={cn("font-bold text-base leading-tight mt-0.5 transition-colors", selectedHashtag === tag ? "text-primary" : "group-hover:text-primary")}>{tag}</h4>
										<p className="text-xs text-muted-foreground mt-0.5">{count} post{count !== 1 ? 's' : ''}</p>
									</button>
								))}
							</div>
						) : (
							<div className="py-8 text-center bg-muted/20 rounded-2xl border border-dashed border-border/50">
								<p className="text-xs text-muted-foreground italic font-medium">No hashtags trending yet.<br />Start a conversation!</p>
							</div>
						)}
					</div>

					{/* People You May Know (Real) */}
					{peopleSuggestions.length > 0 && (
						<div className="bg-gradient-to-br from-primary/10 via-card/40 to-card/40 backdrop-blur-md border border-primary/10 rounded-[2.5rem] p-6">
							<h3 className="font-black text-lg italic tracking-tight mb-4">You might know</h3>
							<div className="space-y-4">
								{peopleSuggestions.slice(0, 3).map((person) => (
									<div key={person.id} className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<Avatar className="h-9 w-9 border border-border">
												<AvatarImage src={person.avatarUrl} />
												<AvatarFallback>{person.fullName?.[0] || 'U'}</AvatarFallback>
											</Avatar>
											<div>
												<p className="text-sm font-bold leading-none">{person.fullName}</p>
												<p className="text-[10px] text-muted-foreground">{person.department || person.role || 'Student'}</p>
											</div>
										</div>
										<Button size="icon" variant="ghost" onClick={() => handleConnect(person.id)} className="h-8 w-8 rounded-full hover:bg-primary/20 hover:text-primary">
											<UserPlus className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			<CommentModal
				isOpen={isCommentModalOpen && !!commentPostId}
				onClose={() => { setIsCommentModalOpen(false); setCommentPostId(null); }}
				postId={commentPostId || ""}
				postAuthorName={posts.find(p => p.id === commentPostId)?.author.name || "Unknown"}
			/>

			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent className="bg-card border-border">
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>This action cannot be undone. This will permanently delete your post.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="bg-muted hover:bg-muted/80">Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</DashboardLayout>
	);
};
