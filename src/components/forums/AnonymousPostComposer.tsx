
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EyeOff, Send, VenetianMask, Loader2, Tag as TagIcon, X, Sparkles, ShieldCheck, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useUserUniversity } from "@/hooks/useUserUniversity";
import { motion, AnimatePresence } from "framer-motion";
import { FORUM_CATEGORIES } from "./ForumCategoryGrid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AnonymousPostComposerProps {
    refreshThreads?: () => void;
    activeCategory: string;
    activeScope: "campus" | "universe";
}

export function AnonymousPostComposer({ refreshThreads, activeCategory: initialCategory, activeScope }: AnonymousPostComposerProps) {
    const { universityId } = useUserUniversity();
    const [isIncognito, setIsIncognito] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);

    const currentCategory = FORUM_CATEGORIES.find(cat => cat.id === selectedCategory);

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
                category: selectedCategory,
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
            void import("@/lib/analytics").then(({ track }) => track("create_forum_thread", { isAnonymous: isIncognito }));
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
                "group relative rounded-2xl border transition-all duration-300 overflow-hidden shadow-lg",
                isIncognito 
                    ? "bg-zinc-950/90 border-zinc-800 shadow-emerald-500/5" 
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

            <div className="p-4 md:p-6 space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500 shadow-inner",
                            isIncognito 
                                ? "bg-emerald-500/10 text-emerald-500" 
                                : "bg-primary/10 text-primary"
                        )}>
                            {isIncognito ? <VenetianMask className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                        </div>
                        <div>
                            <h3 className={cn(
                                "font-bold text-sm tracking-tight uppercase",
                                isIncognito ? "text-zinc-100" : "text-foreground"
                            )}>
                                {isIncognito ? "Anonymous Draft" : "Public Discussion"}
                            </h3>
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck className={cn("h-3 w-3", isIncognito ? "text-emerald-500" : "text-primary")} />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
                                    {isIncognito ? "Zero-Knowledge Active" : "Public University Channel"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-muted/20 px-2 py-1 rounded-lg border border-border/30">
                        <span className={cn(
                            "font-bold text-[9px] uppercase tracking-wider",
                            activeScope === "universe" ? "text-amber-500" : "text-blue-500"
                        )}>
                            {activeScope}
                        </span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div onClick={() => setIsExpanded(true)}>
                        <Input
                            placeholder={isIncognito ? "Whisper something to the campus..." : "What's on your mind?"}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={cn(
                                "h-10 border-none shadow-none text-lg font-bold tracking-tight placeholder:text-muted-foreground/30 focus-visible:ring-0 px-0 bg-transparent outline-none",
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
                                className="space-y-4"
                            >
                                <Textarea
                                    placeholder="Dive deeper into the details..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className={cn(
                                        "resize-none min-h-[120px] border-none focus-visible:ring-0 px-0 bg-transparent text-base font-medium leading-relaxed placeholder:text-muted-foreground/40 outline-none",
                                        isIncognito ? "text-zinc-300" : "text-muted-foreground"
                                    )}
                                />

                                {/* Category Selector */}
                                <div className="p-4 rounded-xl bg-muted/10 border border-border/20">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Category
                                        </span>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 px-3 bg-muted/30 hover:bg-muted/50 border border-border/50 rounded-lg font-bold text-xs gap-2"
                                                >
                                                    {currentCategory ? (
                                                        <>
                                                            {currentCategory.icon && <currentCategory.icon className="h-3.5 w-3.5" />}
                                                            <span>{currentCategory.name}</span>
                                                        </>
                                                    ) : (
                                                        <span>Select Category</span>
                                                    )}
                                                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-xl">
                                                {FORUM_CATEGORIES.map((cat) => (
                                                    <DropdownMenuItem
                                                        key={cat.id}
                                                        onClick={() => setSelectedCategory(cat.id)}
                                                        className={cn(
                                                            "cursor-pointer py-2 px-4 rounded-lg mb-1",
                                                            selectedCategory === cat.id 
                                                                ? "bg-primary/10 text-primary font-bold" 
                                                                : ""
                                                        )}
                                                    >
                                                        <cat.icon className={cn("h-4 w-4 mr-2", cat.color)} />
                                                        <div className="flex flex-col gap-1">
                                                            <span className="font-bold text-sm">{cat.name}</span>
                                                            <span className="text-[11px] text-muted-foreground">{cat.description}</span>
                                                        </div>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground italic">
                                        {currentCategory?.description}
                                    </p>
                                </div>

                                <div className="space-y-2 p-4 rounded-xl bg-muted/10 border border-border/20">
                                    <div className="flex flex-wrap gap-1.5">
                                        {tags.map(tag => (
                                            <Badge 
                                                key={tag} 
                                                className={cn(
                                                    "gap-1 pl-2 pr-1 py-0.5 rounded-md font-bold tracking-wider text-[9px] uppercase border-none",
                                                    isIncognito ? "bg-zinc-800 text-emerald-400" : "bg-primary/10 text-primary"
                                                )}
                                            >
                                                #{tag}
                                                <button onClick={() => removeTag(tag)} className="hover:bg-white/10 rounded-full p-0.5">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                        <Input 
                                            placeholder="Tag your conversation (press Enter)" 
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={handleAddTag}
                                            className="h-8 text-xs border-none bg-transparent focus-visible:ring-0 p-0 font-bold tracking-tight placeholder:text-muted-foreground/60 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/10">
                                    <div className="flex items-center gap-3 bg-muted/10 p-2 rounded-xl border border-border/20 w-full sm:w-auto">
                                        <Switch
                                            id="incognito-mode"
                                            checked={isIncognito}
                                            onCheckedChange={setIsIncognito}
                                            className="data-[state=checked]:bg-emerald-500 h-5 w-9"
                                        />
                                        <Label htmlFor="incognito-mode" className="text-[10px] font-bold uppercase tracking-wider cursor-pointer">
                                            {isIncognito ? "Identity Masked" : "Identity Visible"}
                                        </Label>
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => setIsExpanded(false)}
                                            className="h-10 px-4 rounded-xl font-bold text-xs text-muted-foreground"
                                        >
                                            Discard
                                        </Button>
                                        <Button 
                                            size="sm"
                                            onClick={handlePost} 
                                            disabled={loading}
                                            className={cn(
                                                "h-10 px-6 rounded-xl font-bold text-xs transition-all flex-1 sm:flex-none",
                                                isIncognito 
                                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                                                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                                            )}
                                        >
                                            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                                            BROADCAST
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

