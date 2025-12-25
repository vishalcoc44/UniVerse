
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EyeOff, Send, VenetianMask, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner"; // Assuming sonner is installed, otherwise standard alert

interface AnonymousPostComposerProps {
    refreshThreads?: () => void;
    activeCategory: string;
}

export function AnonymousPostComposer({ refreshThreads, activeCategory }: AnonymousPostComposerProps) {
    const [isIncognito, setIsIncognito] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

    const handlePost = async () => {
        if (!title.trim() || !content.trim()) return;

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Please log in to post.");
                return;
            }

            // Fetch user's universityId
            const { data: profile } = await supabase
                .from('Profile')
                .select('universityId')
                .eq('id', user.id)
                .single();

            const { error } = await supabase.from('ForumThread').insert({
                title,
                content,
                isAnonymous: isIncognito,
                category: activeCategory === 'all' ? 'general' : activeCategory,
                scope: 'CAMPUS', // Default to CAMPUS for forums
                universityId: profile?.universityId,
                authorId: user.id
            });

            if (error) throw error;

            setTitle("");
            setContent("");
            setIsExpanded(false);
            if (refreshThreads) refreshThreads();

        } catch (error) {
            console.error("Error creating post:", error);
            alert("Failed to create post");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className={cn(
            "p-5 transition-all duration-500 border-border/50 overflow-hidden relative",
            isIncognito ? "bg-zinc-900 border-zinc-800" : "bg-card/50 backdrop-blur-sm"
        )}>
            {/* Incognito Background Effect */}
            {isIncognito && (
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
            )}

            <div className="flex items-start gap-4 transition-all" >
                <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300",
                    isIncognito ? "bg-zinc-800 text-zinc-400" : "bg-muted text-muted-foreground"
                )}>
                    {isIncognito ? <VenetianMask className="h-6 w-6" /> : <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full" />}
                </div>

                <div className="flex-1 space-y-3">
                    <div onClick={() => setIsExpanded(true)}>
                        <Input
                            placeholder={isIncognito ? "Ask anonymously..." : "Start a discussion"}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={cn(
                                "border-none shadow-none text-lg font-medium placeholder:text-muted-foreground/50 transition-colors focus-visible:ring-0 px-0 h-auto py-1",
                                isIncognito ? "bg-transparent text-zinc-200 placeholder:text-zinc-600" : "bg-transparent"
                            )}
                        />
                    </div>

                    {isExpanded && (
                        <div className="animate-in fade-in slide-in-from-top-2 space-y-3">
                            <Textarea
                                placeholder="Provide more context..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className={cn(
                                    "resize-none min-h-[100px] border-none focus-visible:ring-0 p-0",
                                    isIncognito ? "bg-transparent text-zinc-300 placeholder:text-zinc-600" : "bg-transparent"
                                )}
                            />

                            <div className="flex items-center justify-between pt-2 border-t border-border/10">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="incognito-mode"
                                        checked={isIncognito}
                                        onCheckedChange={setIsIncognito}
                                        className="data-[state=checked]:bg-zinc-700"
                                    />
                                    <Label htmlFor="incognito-mode" className={cn("text-xs font-medium cursor-pointer select-none", isIncognito ? "text-zinc-400" : "text-muted-foreground")}>
                                        {isIncognito ? "Incognito ON (Untraceable)" : "Post Publicly"}
                                    </Label>
                                </div>

                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>Cancel</Button>
                                    <Button size="sm" onClick={handlePost} disabled={loading} className={cn(
                                        "transition-all",
                                        isIncognito ? "bg-zinc-100 text-zinc-900 hover:bg-white" : ""
                                    )}>
                                        {loading ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Send className="h-3 w-3 mr-2" />}
                                        Post
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
