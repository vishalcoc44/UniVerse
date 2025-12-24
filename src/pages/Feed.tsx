import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SharePostBox } from "@/components/feed/SharePostBox";
import { PostCard } from "@/components/feed/PostCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Globe, School } from "lucide-react";

const Feed = () => {
    // Mock Data for Campus Feed
    const campusPosts = [
        {
            author: {
                name: "Dr. Sarah Miller",
                handle: "prof_miller",
                avatar: "https://i.pravatar.cc/150?u=sarah",
                role: "Faculty • CS Dept"
            },
            content: "Reminder: The submission deadline for the AI Research grant proposals has been extended to Friday. Don't miss this opportunity to fund your projects! 🚀 #Research #AI #Grants",
            timestamp: "2h ago",
            stats: { likes: 45, comments: 12, shares: 5 },
            tags: ["Research", "AI", "Announcements"],
            feedType: "campus" as const
        },
        {
            author: {
                name: "Tech Club",
                handle: "dsu_tech_club",
                avatar: "https://i.pravatar.cc/150?u=tech",
                role: "Official Club"
            },
            content: "Hackathon registration is LIVE! Join us for 24 hours of coding, pizza, and prizes. Team formation event is tonight at 6 PM in the Student Center.",
            image: "https://images.unsplash.com/photo-1504384308090-c54be3852f33?auto=format&fit=crop&q=80&w=800",
            timestamp: "5h ago",
            stats: { likes: 128, comments: 34, shares: 22 },
            tags: ["Hackathon", "Coding", "Events"],
            feedType: "campus" as const
        }
    ];

    // Mock Data for Universe Feed
    const universePosts = [
        {
            author: {
                name: "Alex Chen",
                handle: "achen_mit",
                avatar: "https://i.pravatar.cc/150?u=alex",
                role: "MIT • CS '24"
            },
            content: "Just published my roadmap for learning Generative AI in 2025. Includes free resources from Stanford, Google, and more. Check it out and let me know what you think! 📚✨",
            image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800",
            timestamp: "1h ago",
            stats: { likes: 892, comments: 145, shares: 320 },
            tags: ["GenAI", "LearningResource", "Programming"],
            feedType: "universe" as const
        },
        {
            author: {
                name: "Emily Watson",
                handle: "ewatson_stanford",
                avatar: "https://i.pravatar.cc/150?u=emily",
                role: "Stanford • Neuroscience"
            },
            content: "Looking for collaborators for a cross-university study on sleep patterns in engineering students. DM if you're interested in data analysis or participant recruitment!",
            timestamp: "3h ago",
            stats: { likes: 56, comments: 23, shares: 14 },
            tags: ["Research", "Collaboration", "Neuroscience"],
            feedType: "universe" as const
        }
    ];

    return (
        <DashboardLayout
            title="Social Feed"
            subtitle="Connect with your campus and the universe."
            breadcrumb={["UniVerse", "Feed"]}
        >
            <div className="max-w-2xl mx-auto w-full">
                <Tabs defaultValue="campus" className="w-full mb-6">
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

                    <SharePostBox />

                    <TabsContent value="campus" className="space-y-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                        {campusPosts.map((post, i) => (
                            <PostCard key={i} {...post} />
                        ))}
                    </TabsContent>

                    <TabsContent value="universe" className="space-y-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                        {universePosts.map((post, i) => (
                            <PostCard key={i} {...post} />
                        ))}
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default Feed;
