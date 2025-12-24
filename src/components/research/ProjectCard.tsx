import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, CheckCircle2, FlaskConical, Users } from "lucide-react";

export function ProjectCard() {
    return (
        <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
            <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-200">
                            Open for Applications
                        </Badge>
                        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                            Generative AI for Healthcare Diagnostics
                        </h3>
                    </div>
                    <div className="bg-muted p-2 rounded-lg">
                        <FlaskConical className="h-5 w-5 text-muted-foreground" />
                    </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                    Developing a multi-modal neural network to analyze X-ray images and medical reports for early disease detection. Looking for students with PyTorch experience.
                </p>

                <div className="flex flex-wrap gap-2">
                    {["Python", "PyTorch", "Computer Vision"].map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-1 bg-secondary rounded-md font-medium text-secondary-foreground">
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src="https://i.pravatar.cc/150?u=prof" />
                            <AvatarFallback>DR</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">Dr. R. Sharma</span>
                    </div>
                    <Button size="sm" className="h-8 text-xs">
                        Apply Now
                    </Button>
                </div>
            </div>
        </Card>
    );
}
