import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ForumCategoryGrid } from "@/components/forums/ForumCategoryGrid";
import { AnonymousPostComposer } from "@/components/forums/AnonymousPostComposer";
import { ThreadList } from "@/components/forums/ThreadList";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";

const Forums = () => {
    const [activeCategory, setActiveCategory] = useState("all");

    return (
        <DashboardLayout
            title="Anonymous Forums"
            subtitle="Speak your mind freely and safely."
            breadcrumb={["UniVerse", "Forums"]}
        >
            <div className="max-w-6xl mx-auto">
                <ForumCategoryGrid activeId={activeCategory} onSelect={setActiveCategory} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Feed */}
                    <div className="lg:col-span-2 space-y-6">
                        <AnonymousPostComposer />

                        <div className="flex items-center justify-between pb-2 border-b border-border/50">
                            <h3 className="font-semibold text-lg">Trending Discussions</h3>
                            <select className="text-sm bg-background/50 border border-border/50 rounded-md p-1">
                                <option>Hot</option>
                                <option>New</option>
                                <option>Top This Week</option>
                            </select>
                        </div>

                        <ThreadList />
                    </div>

                    {/* Sidebar Rules & Info */}
                    <div className="space-y-6">
                        <Card className="p-5 border-border/50 bg-card/40 backdrop-blur-sm">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-amber-500" />
                                Community Rules
                            </h3>
                            <ul className="space-y-3 text-sm text-muted-foreground list-disc pl-4">
                                <li>Be respectful. Harassment is not tolerated even anonymously.</li>
                                <li>Do not share personal information (doxing).</li>
                                <li>Keep discussions relevant to the category.</li>
                                <li>Faculty verification is visible on academic answers.</li>
                            </ul>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Forums;
