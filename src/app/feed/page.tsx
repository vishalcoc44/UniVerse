'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SharePostBox } from "@/components/feed/SharePostBox";
import { PostCard } from "@/components/feed/PostCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Globe, School, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { CommentModal } from "@/components/feed/CommentModal";
import { Bookmark as BookmarkIcon } from "lucide-react";
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
			title="Social Feed"
			subtitle="Connect with your campus and the universe."
			breadcrumb={["UniVerse", "Feed"]}
		>
			<div className="max-w-2xl mx-auto w-full">
				<Tabs defaultValue="campus" value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
					<div className="flex items-center justify-between mb-4">
						<TabsList className="grid w-full sm:w-[360px] grid-cols-3 bg-card/60 backdrop-blur-sm border border-border/50">
							<TabsTrigger value="campus" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
								<School className="w-4 h-4 mr-2" /> Campus
							</TabsTrigger>
							<TabsTrigger value="universe" className="data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-600">
								<Globe className="w-4 h-4 mr-2" /> Universe
							</TabsTrigger>
							<TabsTrigger value="bookmarks" className="data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-600">
								<BookmarkIcon className="w-4 h-4 mr-2" /> Saved
							</TabsTrigger>
						</TabsList>

						<div className="hidden sm:flex gap-2">
							<Badge variant="outline" className="text-muted-foreground font-normal bg-card/50">
								Trending: #FinalsWeek
							</Badge>
							<Badge variant="outline" className="text-muted-foreground font-normal bg-card/50">
								#Hackathon
							</Badge>
						</div>
					</div>

					{activeTab !== 'bookmarks' && <SharePostBox onPostCreated={fetchPosts} />}

					{/* Category Filter Bar */}
					<div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
						<Badge
							variant={selectedCategory === null ? "default" : "secondary"}
							className="cursor-pointer hover:opacity-80 transition-opacity"
							onClick={() => setSelectedCategory(null)}
						>
							All
						</Badge>
						{categories.map((cat) => (
							<Badge
								key={cat}
								variant={selectedCategory === cat ? "default" : "secondary"}
								className="cursor-pointer hover:opacity-80 transition-opacity"
								onClick={() => setSelectedCategory(cat)}
							>
								{cat}
							</Badge>
						))}
					</div>

					<TabsContent value="campus" className="space-y-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
						{loading ? (
							<div className="flex justify-center p-8">
								<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
							</div>
						) : posts.length === 0 ? (
							<div className="text-center p-8 text-muted-foreground">
								No posts yet. Be the first to share!
							</div>
						) : (
							posts.map((post) => (
								<PostCard
									key={post.id}
									{...post}
									scope={post.scope}
									onLike={handleLike}
									onBookmark={handleBookmark}
									onDelete={handleDeleteClick}
									onComment={handleComment}
									onConnect={handleConnect}
								/>
							))
						)}
					</TabsContent>

					<TabsContent value="universe" className="space-y-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
						{loading ? (
							<div className="flex justify-center p-8">
								<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
							</div>
						) : posts.length === 0 ? (
							<div className="text-center p-8 text-muted-foreground">
								No posts yet. Be the first to share!
							</div>
						) : (
							posts.map((post) => (
								<PostCard
									key={post.id}
									{...post}
									scope={post.scope}
									onLike={handleLike}
									onBookmark={handleBookmark}
									onDelete={handleDeleteClick}
									onComment={handleComment}
									onConnect={handleConnect}
								/>
							))
						)}
					</TabsContent>

					<TabsContent value="bookmarks" className="space-y-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
						{loading ? (
							<div className="flex justify-center p-8">
								<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
							</div>
						) : posts.length === 0 ? (
							<div className="text-center p-8 text-muted-foreground">
								No bookmarks yet. Save some posts!
							</div>
						) : (
							posts.map((post) => (
								<PostCard
									key={post.id}
									{...post}
									scope={post.scope}
									onLike={handleLike}
									onBookmark={handleBookmark}
									onDelete={handleDeleteClick}
									onComment={handleComment}
									onConnect={handleConnect}
								/>
							))
						)}
					</TabsContent>
				</Tabs>
			</div>

			<CommentModal
				isOpen={!!commentPostId}
				onClose={() => setCommentPostId(null)}
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
