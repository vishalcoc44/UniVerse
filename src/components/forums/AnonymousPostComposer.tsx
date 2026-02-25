
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EyeOff, Send, VenetianMask, Loader2, Tag as TagIcon, X, Sparkles, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useUserUniversity } from "@/hooks/useUserUniversity";
import { motion, AnimatePresence } from "framer-motion";

interface AnonymousPostComposerProps {
    refreshThreads?: () => void;
    activeCategory: string;
    activeScope: "campus" | "universe";
}

export function AnonymousPostComposer({ refreshThreads, activeCategory, activeScope }: AnonymousPostComposerProps) {
    const { universityId } = useUserUniversity();
    const [isIncognito, setIsIncognito] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim().toLowerCase())) {
                setTags([...tags, tagInput.trim().toLowerCase()]);
            }
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handlePost = async () => {
        if (!title.trim() || !content.trim()) return;

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Please log in to post.");
                return;
            }

            const threadScope = activeScope === "universe" ? "UNIVERSE" : "CAMPUS";

            if (threadScope === "CAMPUS" && !universityId) {
                toast.error("Campus posting requires a university-mapped account. Switch to Universe scope.");
                return;
            }

            const { error } = await supabase.from('ForumThread').insert({
                id: crypto.randomUUID(),
                title,
                content,
                isAnonymous: isIncognito,
                category: activeCategory === 'all' ? 'general' : activeCategory,
                scope: threadScope,
                universityId: threadScope === "CAMPUS" ? universityId : null,
                authorId: user.id,
                tags: tags,
                updatedAt: new Date().toISOString()
            });

            if (error) throw error;

            setTitle("");
            setContent("");
            setTags([]);
            setIsExpanded(false);
            if (refreshThreads) refreshThreads();
            toast.success("Thread shared securely!");

        } catch (error: any) {
            console.error("Error creating post details:", error.message || error);
            toast.error("Failed to share: " + (error.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            layout
            className={cn(
                "group relative rounded-[2.5rem] border transition-all duration-500 overflow-hidden shadow-2xl",
                isIncognito 
                    ? "bg-zinc-950/80 border-zinc-800/50 shadow-emerald-500/5" 
                    : "bg-card/40 backdrop-blur-xl border-border/50 shadow-primary/5"
            )}
        >
            {/* Animated Gradient Background for Incognito */}
            <AnimatePresence>
                {isIncognito && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.05),transparent)] pointer-events-none"
                    />
                )}
            </AnimatePresence>

            <div className="p-8 space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
                            isIncognito 
                                ? "bg-emerald-500/10 text-emerald-500 rotate-12 group-hover:rotate-0" 
                                : "bg-primary/10 text-primary"
                        )}>
                            {isIncognito ? <VenetianMask className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
                        </div>
                        <div>
                            <h3 className={cn(
                                "font-black text-xl italic tracking-tighter uppercase",
                                isIncognito ? "text-zinc-100" : "text-foreground"
                            )}>
                                {isIncognito ? "Anonymous Draft" : "Public Discussion"}
                            </h3>
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck className={cn("h-3 w-3", isIncognito ? "text-emerald-500" : "text-primary")} aria-hidden="true" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
                                    {isIncognito ? "Zero-Knowledge Encryption Active" : "Public University Channel"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-muted/20 p-1.5 rounded-2xl border border-border/30">
                        <Badge 
                            variant="outline" 
                            className={cn(
                                "border-none font-black italic tracking-widest text-[9px] uppercase px-3",
                                activeScope === "universe" ? "text-amber-500" : "text-blue-500"
                            )}
                            aria-label={`Current scope: ${activeScope}`}
                        >
                            {activeScope}
                        </Badge>
                    </div>
                </div>

                <div className="space-y-4">
                    <div onClick={() => setIsExpanded(true)}>
                        <Input
                            placeholder={isIncognito ? "Whisper something to the campus..." : "What's on your mind?"}
                            aria-label="Discussion title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={cn(
                                "h-14 border-none shadow-none text-2xl font-black italic tracking-tighter placeholder:text-muted-foreground/30 transition-all focus-visible:ring-0 px-0 bg-transparent outline-none",
                                isIncognito ? "text-emerald-50" : "text-foreground"
                            )}
                        />
                    </div>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-6 pt-2"
                                role="region"
                                aria-label="Compose post"
                            >
                                <Textarea
                                    placeholder="Dive deeper into the details..."
                                    aria-label="Discussion content"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className={cn(
                                        "resize-none min-h-[160px] border-none focus-visible:ring-0 px-0 bg-transparent text-lg font-medium leading-relaxed italic tracking-tight placeholder:text-muted-foreground/40 outline-none",
                                        isIncognito ? "text-zinc-300" : "text-muted-foreground"
                                    )}
                                />

                                <div className="space-y-3 p-6 rounded-3xl bg-muted/10 border border-border/20 shadow-inner">
                                    <div className="flex flex-wrap gap-2" role="list" aria-label="Selected tags">
                                        {tags.map(tag => (
                                            <Badge 
                                                key={tag} 
                                                role="listitem"
                                                className={cn(
                                                    "gap-1.5 pl-3 pr-1 py-1 rounded-full font-black italic tracking-widest text-[10px] uppercase border-none",
                                                    isIncognito ? "bg-zinc-800 text-emerald-400" : "bg-primary/10 text-primary"
                                                )}
                                            >
                                                #{tag}
                                                <button 
                                                    onClick={() => removeTag(tag)} 
                                                    aria-label={`Remove tag ${tag}`}
                                                    className="hover:bg-white/10 rounded-full p-0.5 transition-colors focus-visible:ring-1 focus-visible:ring-primary outline-none"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <TagIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                        <Input 
                                            placeholder="Tag your conversation (press Enter)" 
                                            aria-label="Add a tag"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={handleAddTag}
                                            className="h-10 text-sm border-none bg-transparent focus-visible:ring-0 p-0 font-black italic tracking-tight placeholder:text-muted-foreground/60 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-border/10">
                                    <div className="flex items-center gap-4 bg-muted/10 p-2.5 rounded-[1.5rem] border border-border/20">
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <Switch
                                                id="incognito-mode-enhanced"
                                                checked={isIncognito}
                                                onCheckedChange={setIsIncognito}
                                                className="data-[state=checked]:bg-emerald-500 h-6 w-11 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                                            />
                                        </div>
                                        <Label 
                                            htmlFor="incognito-mode-enhanced" 
                                            className={cn(
                                                "text-xs font-black italic tracking-widest uppercase cursor-pointer select-none", 
                                                isIncognito ? "text-emerald-500" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {isIncognito ? "Identity Masked" : "Identity Visible"}
                                        </Label>
                                    </div>

                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => setIsExpanded(false)}
                                            className="h-14 px-8 rounded-2xl font-black italic tracking-tighter text-muted-foreground hover:bg-muted transition-all focus-visible:ring-2 focus-visible:ring-primary"
                                        >
                                            Discard Draft
                                        </Button>
                                        <Button 
                                            onClick={handlePost} 
                                            disabled={loading}
                                            className={cn(
                                                "h-14 px-10 rounded-2xl font-black italic tracking-tighter transition-all shadow-xl shadow-primary/20 flex-1 sm:flex-none focus-visible:ring-2 ring-offset-2",
                                                isIncognito 
                                                    ? "bg-emerald-500 hover:bg-emerald-600 focus-visible:ring-emerald-500 text-white shadow-emerald-500/20" 
                                                    : "bg-primary hover:bg-primary/90 focus-visible:ring-primary text-primary-foreground"
                                            )}
                                        >
                                            {loading ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <Send className="h-5 w-5 mr-3" />}
                                            INITIATE BROADCAST
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}

