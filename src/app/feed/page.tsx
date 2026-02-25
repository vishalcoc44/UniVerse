'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SharePostBox } from "@/components/feed/SharePostBox";
import { PostCard } from "@/components/feed/PostCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Globe, School, Loader2, Sparkles, UserPlus, Bookmark as BookmarkIcon, MessageCircle, Activity } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
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

interface Post {
	id: string;
	content: string;
	mediaUrl: string | null;
	scope: "CAMPUS" | "UNIVERSE";
	createdAt: string;
	author: {
		fullName: string;
		username: string;
		avatarUrl: string | null;
		role: string;
	};
	likes: { count: number }[];
	comments: { count: number }[];
	isLiked?: boolean;
}


export default function Feed() {
	const [posts, setPosts] = useState<any[]>([]); // Using any[] for mapped posts temporarily
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("campus");
	const { universityId, loading: uniLoading } = useUserUniversity();

	// Interaction states
	const [commentPostId, setCommentPostId] = useState<string | null>(null);
	const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
	const [postIdToDelete, setPostIdToDelete] = useState<string | null>(null);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

	const categories = [
		"Academic",
		"Events",
		"Social",
		"Marketplace",
		"Career",
		"General"
	];

	const fetchPosts = async () => {
		setLoading(true);
		let query = supabase
			.from('Post')
			.select(`
                *,
                author:Profile(*),
                likes:Like(count),
                comments:Comment(count)
            `)
			.order('createdAt', { ascending: false });

		if (selectedCategory) {
			query = query.eq('category', selectedCategory);
		}

		if (activeTab === 'campus') {
			if (universityId) {
				query = query.eq('scope', 'CAMPUS').eq('universityId', universityId);
			} else {
				// Guest or no uni? Show nothing or public campus posts?
				// Safer to show nothing or just CAMPUS without uni filter (which might expose other uni data if RLS isn't perfect).
				// Given strict requirement, if no uniId, show empty for Campus.
				query = query.eq('scope', 'CAMPUS').eq('universityId', 'non-existent-id');
				// Or better, just handle in UI.
				if (!uniLoading && !universityId) {
					setPosts([]);
					setLoading(false);
					return;
				}
				// If loading, wait? useEffect deps handle it.
			}
		} else if (activeTab === 'universe') {
			query = query.eq('scope', 'UNIVERSE');
		} else if (activeTab === 'bookmarks') {
			// Fetch bookmarks logic
			const { data: { user } } = await supabase.auth.getUser();
			if (user) {
				const { data: bookmarks } = await supabase.from('Bookmark').select('postId').eq('userId', user.id);
				const ids = bookmarks?.map((b: any) => b.postId) || [];
				if (ids.length > 0) {
					query = supabase.from('Post').select(`
                        *,
                        author:Profile(*),
                        likes:Like(count),
                        comments:Comment(count)
                    `).in('id', ids).order('createdAt', { ascending: false });
				} else {
					setPosts([]);
					setLoading(false);
					return;
				}
			} else {
				setPosts([]);
				setLoading(false);
				return;
			}
		}

		const { data, error } = await query;
		const { data: { user } } = await supabase.auth.getUser();

		if (error) {
			console.error('Error fetching posts:', error);
		} else {
			// Fetch my likes and bookmarks
			let likedPostIds = new Set();
			let bookmarkedPostIds = new Set();

			if (user && data && data.length > 0) {
				const postIds = data.map((p: any) => p.id);

				// Parallel fetch for likes and bookmarks
				const [myLikesResponse, myBookmarksResponse] = await Promise.all([
					supabase.from('Like').select('postId').eq('userId', user.id).in('postId', postIds),
					supabase.from('Bookmark').select('postId').eq('userId', user.id).in('postId', postIds)
				]);

				if (myLikesResponse.data) {
					likedPostIds = new Set(myLikesResponse.data.map((l: any) => l.postId));
				}
				if (myBookmarksResponse.data) {
					bookmarkedPostIds = new Set(myBookmarksResponse.data.map((b: any) => b.postId));
				}
			}

			const mappedPosts = data?.map((post: any) => ({
				id: post.id,
				author: {
					id: post.authorId, // Important for permission check
					name: post.author?.fullName || "Unknown",
					handle: post.author?.username || "anon",
					avatar: post.author?.avatarUrl || "https://github.com/shadcn.png",
					role: post.author?.role || "Student"
				},
				content: post.content,
				image: post.mediaUrl,
				timestamp: (() => {
					const raw = post.createdAt;
					// Supabase timestamps are UTC. If no timezone suffix, append 'Z' to force UTC interpretation.
					const dateStr = raw.includes('+') || raw.endsWith('Z') ? raw : (raw.includes('T') ? raw : raw.replace(' ', 'T')) + 'Z';
					return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
				})(),
				stats: {
					likes: post.likes?.[0]?.count || 0,
					comments: post.comments?.[0]?.count || 0,
					shares: 0 // Placeholder
				},
				tags: [],
				scope: post.scope?.toLowerCase() || 'campus',
				isLiked: likedPostIds.has(post.id),
				isBookmarked: bookmarkedPostIds.has(post.id),
				currentUserId: user?.id,
				category: post.category
			})) || [];

			setPosts(mappedPosts);
		}
		setLoading(false);
	};

	const handleLike = async (postId: string) => {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return;

		// 1. Optimistic Update
		setPosts(prevPosts => prevPosts.map(post => {
			if (post.id === postId) {
				const isLiked = !post.isLiked;
				return {
					...post,
					isLiked,
					stats: {
						...post.stats,
						likes: isLiked ? post.stats.likes + 1 : post.stats.likes - 1
					}
				};
			}
			return post;
		}));

		// 2. Database Update
		const post = posts.find(p => p.id === postId);
		if (!post) return;
		const wasLiked = post.isLiked;

		try {
			if (wasLiked) {
				await supabase.from('Like').delete().eq('postId', postId).eq('userId', user.id);
			} else {
				await supabase.from('Like').insert({ postId, userId: user.id });
			}
		} catch (err) {
			console.error("Error toggling like:", err);
			fetchPosts();
		}
	};

	const handleBookmark = async (postId: string) => {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return;

		setPosts(prevPosts => prevPosts.map(post => {
			if (post.id === postId) {
				return { ...post, isBookmarked: !post.isBookmarked };
			}
			return post;
		}));

		const post = posts.find(p => p.id === postId);
		if (!post) return;
		const wasBookmarked = post.isBookmarked;

		try {
			if (wasBookmarked) {
				await supabase.from('Bookmark').delete().eq('postId', postId).eq('userId', user.id);
				// If on bookmarks tab, remove from view
				if (activeTab === 'bookmarks') {
					setPosts(prev => prev.filter(p => p.id !== postId));
				}
			} else {
				await supabase.from('Bookmark').insert({ postId, userId: user.id });
			}
		} catch (err) {
			console.error("Error displaying bookmark:", err);
			fetchPosts();
		}
	};

	const handleComment = (postId: string) => {
		setCommentPostId(postId);
		setIsCommentModalOpen(true);
	};

	const handleDeleteClick = (postId: string) => {
		setPostIdToDelete(postId);
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!postIdToDelete) return;

		const id = postIdToDelete;
		setPostIdToDelete(null);
		setIsDeleteDialogOpen(false);

		// Optimistic remove
		setPosts(prev => prev.filter(p => p.id !== id));

		try {
			const { error } = await supabase.from('Post').delete().eq('id', id);
			if (error) throw error;
			toast.success("Post deleted successfully");
		} catch (err) {
			console.error("Error deleting post:", err);
			toast.error("Failed to delete post");
			fetchPosts();
		}
	};

	const handleConnect = async (userId: string) => {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return;

		try {
			const { error } = await supabase
				.from('Friendship')
				.insert({ requesterId: user.id, addresseeId: userId });

			if (error) {
				if (error.code === '23505') { // Unique violation
					toast.info("Friend request already sent or you are already friends.");
				} else {
					throw error;
				}
			} else {
				toast.success("Friend request sent!");
			}
		} catch (err) {
			console.error("Error sending friend request:", err);
			toast.error("Failed to send friend request.");
		}
	};

	useEffect(() => {
		if (!uniLoading) {
			fetchPosts();
		}

		// Subscribe to real-time updates
		const channel = supabase
			.channel('public:Post')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'Post' }, (payload) => {
				console.log('Change received!', payload);
				fetchPosts(); // Refresh on any change
			})
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [activeTab, universityId, uniLoading, selectedCategory]);

	return (
		<DashboardLayout
			title={
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
						<Activity className="h-6 w-6" />
					</div>
					<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
						Social <span className="text-primary">Feed</span>
					</h1>
				</div>
			}
			subtitle="Connect with your campus and the universe."
			breadcrumb={["UniVerse", "Feed"]}
		>
			<div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto w-full pb-20">
				{/* Main Content Area */}
				<div className="flex-1 min-w-0">
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

								{/* Desktop Category filter */}
								<div className="hidden xl:flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
									<Badge
										variant={selectedCategory === null ? "default" : "outline"}
										className={cn(
											"cursor-pointer px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-all",
											selectedCategory === null ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted/50"
										)}
										onClick={() => setSelectedCategory(null)}
									>
										Recent
									</Badge>
									{categories.slice(0, 3).map((cat) => (
										<Badge
											key={cat}
											variant={selectedCategory === cat ? "default" : "outline"}
											className={cn(
												"cursor-pointer px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-all",
												selectedCategory === cat ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted/50"
											)}
											onClick={() => setSelectedCategory(cat)}
										>
											{cat}
										</Badge>
									))}
								</div>
							</div>
						</Tabs>
					</div>

					<div className="mt-6">
						{activeTab !== 'bookmarks' && (
							<motion.div
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ duration: 0.3 }}
							>
								<SharePostBox onPostCreated={fetchPosts} />
							</motion.div>
						)}

						{/* Mobile Category Filter Bar */}
						<div className="flex xl:hidden gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
							<button
								onClick={() => setSelectedCategory(null)}
								className={cn(
									"px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap",
									selectedCategory === null
										? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
										: "bg-card/60 backdrop-blur-sm border border-border/50 text-muted-foreground hover:bg-muted/50"
								)}
							>
								All Feed
							</button>
							{categories.map((cat) => (
								<button
									key={cat}
									onClick={() => setSelectedCategory(cat)}
									className={cn(
										"px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap",
										selectedCategory === cat
											? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
											: "bg-card/60 backdrop-blur-sm border border-border/50 text-muted-foreground hover:bg-muted/50"
									)}
								>
									{cat}
								</button>
							))}
						</div>

						<div className="space-y-4">
							{loading ? (
								<div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
									<Loader2 className="h-10 w-10 animate-spin text-primary" />
									<p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Gathering your universe...</p>
								</div>
							) : posts.length === 0 ? (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="text-center py-24 bg-card/20 rounded-[3rem] border-2 border-dashed border-border/50"
								>
									<p className="text-muted-foreground italic">
										No posts found in this section yet.
									</p>
								</motion.div>
							) : (
								posts.map((post, idx) => (
									<motion.div
										key={post.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.4, delay: idx * 0.05 }}
									>
										<PostCard
											{...post}
											scope={post.scope}
											onLike={handleLike}
											onBookmark={handleBookmark}
											onDelete={handleDeleteClick}
											onComment={handleComment}
											onConnect={handleConnect}
										/>
									</motion.div>
								))
							)}
						</div>
					</div>
				</div>

				{/* Right Sidebar - Desktop Only */}
				<div className="hidden lg:block w-[320px] space-y-6">
					{/* Trending Card */}
					<div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-[2.5rem] p-6 sticky top-6">
						<div className="flex items-center justify-between mb-6">
							<h3 className="font-black text-xl italic tracking-tight flex items-center gap-2">
								<Sparkles className="h-5 w-5 text-amber-500" />
								Trending
							</h3>
						</div>

						<div className="space-y-6">
							<div className="group cursor-pointer">
								<p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 group-hover:text-primary transition-colors">Campus • Trending</p>
								<h4 className="font-bold text-base leading-tight mt-1 group-hover:text-primary transition-colors">#FinalsWeekSurvival</h4>
								<p className="text-xs text-muted-foreground mt-1">1,240 students posting</p>
							</div>

							<div className="group cursor-pointer">
								<p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Technology • 1h ago</p>
								<h4 className="font-bold text-base leading-tight mt-1 group-hover:text-primary transition-colors">#HackTheCampus2026</h4>
								<p className="text-xs text-muted-foreground mt-1">856 discussions today</p>
							</div>

							<div className="group cursor-pointer">
								<p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Opportunity • Sponsored</p>
								<h4 className="font-bold text-base leading-tight mt-1 group-hover:text-primary transition-colors">Summer Internships at TechCorp</h4>
								<p className="text-xs text-muted-foreground mt-1 text-primary italic font-medium">Coming soon...</p>
							</div>
						</div>

						<Button variant="ghost" className="w-full mt-8 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary border-t border-border/10 pt-4 h-auto">
							Show More Discussions
						</Button>
					</div>

					{/* Connection Suggestions (Optional Placeholder) */}
					<div className="bg-gradient-to-br from-primary/10 via-card/40 to-card/40 backdrop-blur-md border border-primary/10 rounded-[2.5rem] p-6">
						<h3 className="font-black text-lg italic tracking-tight mb-4">You might know</h3>
						<div className="space-y-4">
							{[1, 2].map((i) => (
								<div key={i} className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<Avatar className="h-9 w-9 border border-border">
											<AvatarImage src={`https://i.pravatar.cc/150?u=${i}`} />
											<AvatarFallback>U</AvatarFallback>
										</Avatar>
										<div>
											<p className="text-sm font-bold leading-none">Student {i}</p>
											<p className="text-[10px] text-muted-foreground">@student{i}</p>
										</div>
									</div>
									<Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-primary/20 hover:text-primary">
										<UserPlus className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			<CommentModal
				isOpen={isCommentModalOpen && !!commentPostId}
				onClose={() => {
					setIsCommentModalOpen(false);
					setCommentPostId(null);
				}}
				postId={commentPostId || ""}
				postAuthorName={posts.find(p => p.id === commentPostId)?.author.name || "Unknown"}
			/>

			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent className="bg-card border-border">
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete your post
							and remove its data from our servers.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="bg-muted hover:bg-muted/80">Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</DashboardLayout>
	);
};
