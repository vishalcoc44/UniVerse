
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowBigDown, ArrowBigUp, Flag, MessageSquare, Share2, Loader2, Trash2, Eye, Tag, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useUserUniversity } from "@/hooks/useUserUniversity";

export function ThreadList({ activeCategory, scope = 'campus', sortBy = 'latest' }: { activeCategory?: string, scope?: 'campus' | 'universe', sortBy?: 'latest' | 'trending' }) {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { universityId, loading: uniLoading } = useUserUniversity();

  const fetchThreads = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    let query = supabase
      .from('ForumThread')
      .select(`
          *,
          replies:ForumReply(count),
          votes:ForumVote(value, userId)
      `);

    if (sortBy === 'latest') {
      query = query.order('isPinned', { ascending: false }).order('createdAt', { ascending: false });
    } else if (sortBy === 'trending') {
      query = query.order('isPinned', { ascending: false }).order('viewCount', { ascending: false });
    }

    if (scope === 'campus') {
      if (universityId) {
        query = query.eq('scope', 'CAMPUS').eq('universityId', universityId);
      } else {
        setThreads([]);
        setLoading(false);
        return;
      }
    } else {
      query = query.eq('scope', 'UNIVERSE');
    }

    if (activeCategory && activeCategory !== 'all') {
      query = query.eq('category', activeCategory);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching threads:", error.message || error);
    } else {
      const processedThreads = data?.map(thread => {
        const totalVotes = thread.votes?.reduce((acc: number, v: any) => acc + v.value, 0) || 0;
        const userVote = thread.votes?.find((v: any) => v.userId === user?.id)?.value || 0;
        if (userVote) {
          setUserVotes(prev => ({ ...prev, [thread.id]: userVote }));
        }
        return { ...thread, totalVotes };
      });

      if (sortBy === 'trending') {
        processedThreads.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          const scoreA = (a.totalVotes * 2) + (a.viewCount || 0) + (a.replies[0]?.count * 5);
          const scoreB = (b.totalVotes * 2) + (b.viewCount || 0) + (b.replies[0]?.count * 5);
          return scoreB - scoreA;
        });
      }

      setThreads(processedThreads || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (uniLoading) return;
    fetchThreads();
  }, [activeCategory, scope, universityId, uniLoading]);

  const handleVote = async (threadId: string, value: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentVote = userVotes[threadId] || 0;
    const newValue = currentVote === value ? 0 : value;

    if (newValue === 0) {
      await supabase.from('ForumVote').delete().eq('threadId', threadId).eq('userId', user.id);
    } else {
      await supabase.from('ForumVote').upsert({
        threadId,
        userId: user.id,
        value: newValue
      });
    }

    setUserVotes(prev => ({ ...prev, [threadId]: newValue }));

    // Update local count
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return { ...t, totalVotes: t.totalVotes - currentVote + newValue };
      }
      return t;
    }));
  };

  const handleDeleteThread = async (threadId: string) => {
    try {
      const { error } = await supabase.from('ForumThread').delete().eq('id', threadId);
      if (error) throw error;

      setThreads(prev => prev.filter(t => t.id !== threadId));
      toast.success("Thread deleted successfully");
    } catch (error: any) {
      toast.error(`Failed to delete thread: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6 min-h-[400px]">
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
          <p className="text-xs font-black italic tracking-widest text-muted-foreground uppercase">Decrypting Feed...</p>
        </div>
      ) : threads.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center p-20 text-muted-foreground bg-card/20 rounded-[3rem] border-2 border-dashed border-border/30 flex flex-col items-center gap-6"
        >
          <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center">
            <MessageSquare className="h-8 w-8 opacity-20" />
          </div>
          <div className="space-y-1">
            <p className="text-xl font-black italic tracking-tighter text-foreground">Silence is the only thing here.</p>
            <p className="text-sm font-medium italic">Be the first to shatter the quiet. Post your thoughts.</p>
          </div>
          <Button variant="outline" className="rounded-full font-black italic tracking-tight">Post Something</Button>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-6">
          {threads.map((thread, index) => (
            <motion.div
              key={thread.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={cn(
                "group relative flex overflow-hidden transition-all duration-500 hover:border-primary/50 bg-card/40 backdrop-blur-xl border-border/50 rounded-[2rem] shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
                thread.isPinned && "border-primary/40 bg-primary/5 shadow-primary/10"
              )}>
                {/* Voting Column */}
                <div className="w-16 flex flex-col items-center p-4 gap-2 border-r border-border/20 bg-muted/5 group-hover:bg-muted/10 transition-colors">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Upvote thread. Current votes: ${thread.totalVotes}`}
                    className={cn(
                      "h-10 w-10 rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
                      userVotes[thread.id] === 1 ? "bg-orange-500/20 text-orange-500" : "text-muted-foreground hover:bg-orange-500/10 hover:text-orange-500"
                    )}
                    onClick={() => handleVote(thread.id, 1)}
                  >
                    <ArrowBigUp className="h-7 w-7" />
                  </Button>
                  <span className="text-lg font-black italic tracking-tighter" aria-hidden="true">
                    {thread.totalVotes > 999 ? `${(thread.totalVotes / 1000).toFixed(1)}k` : thread.totalVotes}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Downvote thread"
                    className={cn(
                      "h-10 w-10 rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      userVotes[thread.id] === -1 ? "bg-blue-500/20 text-blue-500" : "text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500"
                    )}
                    onClick={() => handleVote(thread.id, -1)}
                  >
                    <ArrowBigDown className="h-7 w-7" />
                  </Button>
                </div>

                {/* Content Column */}
                <div className="flex-1 p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {thread.isPinned && (
                        <Badge className="bg-primary text-primary-foreground font-black italic tracking-widest text-[9px] uppercase px-2 py-0.5 rounded-md">
                          Pinned
                        </Badge>
                      )}
                      <div className="flex items-center gap-2 px-3 py-1 bg-muted/20 rounded-full border border-border/30">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
                          {thread.category || "General"}
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
                        {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {currentUserId === thread.authorId ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Thread options"
                            className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem
                            onClick={() => handleDeleteThread(thread.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Thread options"
                        className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-2xl font-black italic tracking-tighter text-foreground group-hover:text-primary transition-colors leading-tight">
                      {thread.title}
                    </h3>
                    <p className="text-base font-medium text-muted-foreground/80 italic tracking-tight line-clamp-3 leading-relaxed">
                      {thread.content}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-6" role="list" aria-label="Thread tags">
                    {thread.tags?.map((tag: string) => (
                      <Badge key={tag} role="listitem" className="bg-muted/20 text-muted-foreground hover:bg-muted/30 border-none px-3 py-1 rounded-full font-black italic tracking-widest text-[9px] uppercase">
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/10">
                    <div className="flex items-center gap-6">
                      <button
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors focus-visible:text-primary outline-none focus-visible:underline"
                        aria-label={`${thread.replies ? thread.replies[0]?.count : 0} responses`}
                      >
                        <MessageSquare className="h-4 w-4" aria-hidden="true" />
                        <span className="text-xs font-black italic tracking-widest uppercase">
                          {thread.replies ? thread.replies[0]?.count : 0} RESPONSES
                        </span>
                      </button>
                      <div className="flex items-center gap-2 text-muted-foreground/60" aria-label={`${thread.viewCount || 0} reads`}>
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        <span className="text-xs font-black italic tracking-widest uppercase">
                          {thread.viewCount || 0} READS
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2 mr-2" aria-hidden="true">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-6 w-6 rounded-full border-2 border-background bg-muted" />
                        ))}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
                        {thread.isAnonymous ? "ANONYMOUS SOURCE" : "VERIFIED ID"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )
      }
    </div >
  );
}

