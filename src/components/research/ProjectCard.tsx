
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FlaskConical, Beaker, Users, Calendar, ArrowRight, Microscope, Target, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
    canApply?: boolean;
    applying?: boolean;
    hasApplied?: boolean;
    onApply?: (projectId: string) => Promise<void> | void;
    onDelete?: (projectId: string) => void;
}

export function ProjectCard({ project, canApply = true, applying = false, hasApplied = false, onApply, onDelete }: ProjectCardProps) {
    const statusColors = {
        OPEN: "from-emerald-500 to-teal-500 text-emerald-500",
        ACTIVE: "from-blue-500 to-indigo-500 text-blue-500",
        CLOSED: "from-gray-500 to-slate-500 text-gray-500",
    };

    const currentColor = statusColors[project.status as keyof typeof statusColors] || statusColors.OPEN;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="h-full"
        >
            <Card className="group relative h-full flex flex-col bg-card/40 backdrop-blur-xl border-border/50 rounded-[1.75rem] overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                {/* Status Bar */}
                <div className={cn("h-1 w-full bg-gradient-to-r", currentColor.split(' ').slice(0, 2).join(' '))} />

                <div className="p-6 space-y-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-3">
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-1.5">
                                <Badge className={cn("bg-card/60 backdrop-blur-md border-border/50 font-black italic tracking-widest text-[9px] uppercase py-0.5", currentColor.split(' ').pop())}>
                                    <Target className="h-2.5 w-2.5 mr-1" />
                                    {project.status}
                                </Badge>
                                <Badge variant="outline" className="border-border/50 font-black italic tracking-widest text-[9px] uppercase py-0.5 text-muted-foreground">
                                    {project.lead.department || "General Research"}
                                </Badge>
                            </div>
                            <h3 className="font-black text-xl italic tracking-tighter leading-tight group-hover:text-primary transition-colors duration-300">
                                {project.title}
                            </h3>
                        </div>
                        <div className="flex gap-2">
                            {onDelete && !canApply && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(project.id);
                                    }}
                                    className="p-3 h-auto w-auto rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-500 border border-red-500/20 group-hover:scale-105 transition-transform duration-500"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            )}
                            <div className="p-3 rounded-xl bg-primary/5 text-primary border border-primary/10 group-hover:scale-105 transition-transform duration-500">
                                <Microscope className="h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2 font-medium flex-1">
                        {project.description}
                    </p>

                    <div className="space-y-5 mt-auto pt-5 border-t border-border/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="relative">
                                    <Avatar className="h-8 w-8 border-2 border-background ring-2 ring-primary/10">
                                        <AvatarImage src={project.lead.avatarUrl || undefined} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-black italic text-xs">
                                            {project.lead.fullName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-background flex items-center justify-center">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Lead Researcher</span>
                                    <span className="text-xs font-black italic tracking-tight">{project.lead.fullName}</span>
                                </div>
                            </div>

                            <div className="flex -space-x-1.5">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-6 w-6 rounded-full border border-background bg-muted flex items-center justify-center overflow-hidden">
                                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                            <Users className="h-2.5 w-2.5 text-primary/40" />
                                        </div>
                                    </div>
                                ))}
                                <div className="h-6 w-6 rounded-full border border-background bg-card flex items-center justify-center">
                                    <span className="text-[7px] font-black italic">+5</span>
                                </div>
                            </div>
                        </div>

                        <Button
                            size="sm"
                            className={cn(
                                "w-full h-10 rounded-xl font-black italic tracking-tighter transition-all duration-300 group/btn",
                                hasApplied
                                    ? "bg-muted text-muted-foreground border-border/50"
                                    : "bg-primary text-primary-foreground shadow-lg shadow-primary/10 hover:shadow-primary/20"
                            )}
                            onClick={() => onApply?.(project.id)}
                            disabled={!canApply || applying || hasApplied || project.status !== 'OPEN'}
                        >
                            {applying ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                                    <Beaker className="h-4 w-4" />
                                </motion.div>
                            ) : hasApplied ? (
                                "Applied"
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    Collaborate
                                    <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Decorative background element */}
                <div className="absolute -right-4 -bottom-4 h-32 w-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
            </Card>
        </motion.div>
    );
}
