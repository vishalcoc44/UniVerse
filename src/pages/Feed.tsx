
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SharePostBox } from "@/components/feed/SharePostBox";
import { PostCard } from "@/components/feed/PostCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Globe, School, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

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
}

import { useUserUniversity } from "@/hooks/useUserUniversity";

const Feed = () => {
    const [posts, setPosts] = useState<any[]>([]); // Using any[] for mapped posts temporarily
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("campus");
    const { universityId, loading: uniLoading } = useUserUniversity();

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
        } else {
            query = query.eq('scope', 'UNIVERSE');
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching posts:', error);
        } else {
            // console.log("Fetched posts:", data);

            const mappedPosts = data?.map((post: any) => ({
                id: post.id,
                author: {
                    name: post.author?.fullName || "Unknown",
                    handle: post.author?.username || "anon",
                    avatar: post.author?.avatarUrl || "https://github.com/shadcn.png",
                    role: post.author?.role || "Student"
                },
                content: post.content,
                image: post.mediaUrl,
                timestamp: formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }),
                stats: {
                    likes: post.likes?.[0]?.count || 0,
                    comments: post.comments?.[0]?.count || 0,
                    shares: 0
                },
                tags: [], // Extract tags from content if needed
                scope: post.scope?.toLowerCase() || 'campus'
            })) || [];

            setPosts(mappedPosts);
        }
        setLoading(false);
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
    }, [activeTab, universityId, uniLoading]);

    return (
        <DashboardLayout
            title="Social Feed"
            subtitle="Connect with your campus and the universe."
            breadcrumb={["UniVerse", "Feed"]}
        >
            <div className="max-w-2xl mx-auto w-full">
                <Tabs defaultValue="campus" value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <TabsList className="grid w-[240px] grid-cols-2 bg-card/60 backdrop-blur-sm border border-border/50">
                            <TabsTrigger value="campus" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                                <School className="w-4 h-4 mr-2" /> Campus
                            </TabsTrigger>
                            <TabsTrigger value="universe" className="data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-600">
                                <Globe className="w-4 h-4 mr-2" /> Universe
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

                    <SharePostBox onPostCreated={fetchPosts} />

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
                                <PostCard key={post.id} {...post} scope={post.scope} />
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
                                <PostCard key={post.id} {...post} scope={post.scope} />
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default Feed;
