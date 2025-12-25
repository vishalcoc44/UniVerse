
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FlaskConical } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useState } from "react";

interface ProjectCardProps {
    project: {
        id: string;
        title: string;
        description: string;
        status: string;
        lead: {
            fullName: string;
            avatarUrl: string | null;
            department?: string;
        };
    };
}

export function ProjectCard({ project }: ProjectCardProps) {
    const [applying, setApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);

    const handleApply = async () => {
        setApplying(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Please log in to apply.");
                return;
            }

            // Check if already applied
            const { data: existing } = await supabase.from('ProjectCollaborator')
                .select('id')
                .eq('projectId', project.id)
                .eq('userId', user.id)
                .single();

            if (existing) {
                toast.info("You have already applied or are a collaborator.");
                setHasApplied(true);
                return;
            }

            const { error } = await supabase.from('ProjectCollaborator').insert({
                projectId: project.id,
                userId: user.id,
                role: "APPLICANT" // Assuming schema supports this or just text
            });

            if (error) throw error;

            toast.success("Application sent successfully!");
            setHasApplied(true);
        } catch (error) {
            console.error("Error applying:", error);
            toast.error("Failed to apply.");
        } finally {
            setApplying(false);
        }
    };

    return (
        <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card overflow-hidden h-full flex flex-col">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
            <div className="p-5 space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-200">
                            {project.status === 'OPEN' ? 'Open for Applications' : project.status}
                        </Badge>
                        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                            {project.title}
                        </h3>
                    </div>
                    <div className="bg-muted p-2 rounded-lg shrink-0">
                        <FlaskConical className="h-5 w-5 text-muted-foreground" />
                    </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                    {project.description}
                </p>

                {/* Tags are not in schema, so we omit or mock them if needed. Omitting for now to be schema-accurate. */}

                <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={project.lead.avatarUrl || undefined} />
                            <AvatarFallback>{project.lead.fullName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium">{project.lead.fullName}</span>
                            <span className="text-[10px] text-muted-foreground">{project.lead.department || "Researcher"}</span>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        className="h-8 text-xs"
                        onClick={handleApply}
                        disabled={applying || hasApplied || project.status !== 'OPEN'}
                    >
                        {hasApplied ? "Applied" : "Apply Now"}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
