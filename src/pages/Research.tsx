import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectCard } from "@/components/research/ProjectCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus } from "lucide-react";

const Research = () => {
    return (
        <DashboardLayout
            title="Research Hub"
            subtitle="Collaborate on cutting-edge innovation."
            breadcrumb={["UniVerse", "Research"]}
        >
            <div className="space-y-6">
                {/* Hero / Filter Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card/40 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search projects by domain or professor..." className="pl-9 bg-background/50 border-muted" />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Tabs defaultValue="open">
                            <TabsList className="bg-background/50">
                                <TabsTrigger value="open">Open</TabsTrigger>
                                <TabsTrigger value="ongoing">My Projects</TabsTrigger>
                                <TabsTrigger value="published">Published</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Button className="hidden md:flex gap-2">
                            <Plus className="h-4 w-4" />
                            New Proposal
                        </Button>
                    </div>
                </div>

                {/* Projects Grid */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Featured Opportunities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <ProjectCard key={i} />
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Research;
