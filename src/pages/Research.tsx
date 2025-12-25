
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectCard } from "@/components/research/ProjectCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const Research = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("open");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);

            let query = supabase
                .from('ResearchProject')
                .select(`
                    *,
                    lead:Profile(fullName, avatarUrl, department)
                `)
                .order('createdAt', { ascending: false });

            // Apply filters
            if (activeTab === 'open') {
                query = query.eq('status', 'OPEN');
            } else if (activeTab === 'ongoing') {
                // For "My Projects", we'd ideally filter by user ID, but let's just show ongoing for now or all if auth logic is complex here
                query = query.eq('status', 'ONGOING');
            } else if (activeTab === 'published') {
                query = query.eq('status', 'COMPLETED'); // Assuming published maps to completed
            }

            if (searchQuery) {
                query = query.ilike('title', `%${searchQuery}%`);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching projects:", error);
                toast.error("Failed to load projects.");
            } else {
                setProjects(data || []);
            }
            setLoading(false);
        };

        const debounce = setTimeout(() => {
            fetchProjects();
        }, 300);

        return () => clearTimeout(debounce);
    }, [activeTab, searchQuery]);

    const handleNewProposal = async () => {
        // Mock create logic for now, or open a modal if we had one
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("Please log in to create a proposal.");
            return;
        }

        // Quick create for testing
        const title = prompt("Enter project title:");
        if (!title) return;

        // Fetch user's universityId
        const { data: profile } = await supabase
            .from('Profile')
            .select('universityId')
            .eq('id', user.id)
            .single();

        const { error } = await supabase.from('ResearchProject').insert({
            title,
            description: "New research initiative...",
            status: "OPEN",
            scope: "CAMPUS", // Default to CAMPUS for now, or ask user? Defaulting to CAMPUS as per safe default.
            universityId: profile?.universityId,
            leadId: user.id
        });

        if (error) {
            toast.error("Failed to create project");
        } else {
            toast.success("Project proposal created!");
            // Trigger refetch ideally
            window.location.reload(); // Lazy reload for now
        }
    };

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
                        <Input
                            placeholder="Search projects..."
                            className="pl-9 bg-background/50 border-muted"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="bg-background/50">
                                <TabsTrigger value="open">Open</TabsTrigger>
                                <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
                                <TabsTrigger value="published">Completed</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Button className="hidden md:flex gap-2" onClick={handleNewProposal}>
                            <Plus className="h-4 w-4" />
                            New Proposal
                        </Button>
                    </div>
                </div>

                {/* Projects Grid */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">
                        {activeTab === 'open' ? 'Open Opportunities' : activeTab === 'ongoing' ? 'Active Projects' : 'Published Research'}
                    </h3>

                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="text-center p-12 text-muted-foreground bg-card/40 rounded-xl border border-border/50">
                            No projects found. Why not start one?
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Research;
