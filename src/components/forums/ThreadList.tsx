
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowBigDown, ArrowBigUp, Flag, MessageSquare, Share2, Loader2, Trash2, Eye, Tag, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

const PAGE_SIZE = 25;

export function ThreadList({ activeCategory, scope = 'campus', sortBy = 'latest' }: { activeCategory?: string, scope?: 'campus' | 'universe', sortBy?: 'latest' | 'trending' }) {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { universityId, loading: uniLoading } = useUserUniversity();
  const router = useRouter();

  const fetchThreads = async (pageNum = 0, append = false) => {
    if (append) { setLoadingMore(true); } else { setLoading(true); }
    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

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

    if (activeCategory && activeCategory !== 'general') {
      query = query.eq('category', activeCategory);
    }

    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching threads:", error.message || error);
    } else {
      setHasMore((data?.length ?? 0) === PAGE_SIZE);

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

      if (append) {
        setThreads(prev => [...prev, ...(processedThreads || [])]);
      } else {
        setThreads(processedThreads || []);
      }
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchThreads(nextPage, true);
  };

  useEffect(() => {
    if (uniLoading) return;
    setPage(0);
    setHasMore(true);
    fetchThreads(0, false);
  }, [activeCategory, scope, universityId, uniLoading, sortBy]);

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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index, 10) * 0.05 }}
            >
              <Card className={cn(
                "group relative flex overflow-hidden transition-all duration-300 hover:border-primary/50 bg-card/40 backdrop-blur-xl border-border/50 rounded-2xl shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
                thread.isPinned && "border-primary/40 bg-primary/5 shadow-primary/10"
              )}>
                {/* Voting Column - More Compact */}
                <div className="w-12 flex flex-col items-center py-4 gap-1 border-r border-border/10 bg-muted/5 group-hover:bg-muted/10 transition-colors">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Upvote thread`}
                    className={cn(
                      "h-8 w-8 rounded-lg transition-all",
                      userVotes[thread.id] === 1 ? "text-orange-500 bg-orange-500/10" : "text-muted-foreground hover:text-orange-500 hover:bg-orange-500/5"
                    )}
                    onClick={() => handleVote(thread.id, 1)}
                  >
                    <ArrowBigUp className="h-6 w-6" />
                  </Button>
                  <span className="text-xs font-bold tracking-tight">
                    {thread.totalVotes > 999 ? `${(thread.totalVotes / 1000).toFixed(1)}k` : thread.totalVotes}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Downvote thread"
                    className={cn(
                      "h-8 w-8 rounded-lg transition-all",
                      userVotes[thread.id] === -1 ? "text-blue-500 bg-blue-500/10" : "text-muted-foreground hover:text-blue-500 hover:bg-blue-500/5"
                    )}
                    onClick={() => handleVote(thread.id, -1)}
                  >
                    <ArrowBigDown className="h-6 w-6" />
                  </Button>
                </div>

                {/* Content Column - Reduced Padding */}
                <div className="flex-1 p-4 md:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {thread.isPinned && (
                        <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-[9px] uppercase px-1.5 py-0 rounded-md">
                          Pinned
                        </Badge>
                      )}
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-muted/40 rounded-md border border-border/20">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          {thread.category || "General"}
                        </span>
                      </div>
                      <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/50">
                        {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32 rounded-xl">
                        {currentUserId === thread.authorId && (
                          <DropdownMenuItem
                            onClick={() => handleDeleteThread(thread.id)}
                            className="text-destructive focus:text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="cursor-pointer">
                          <Flag className="h-4 w-4 mr-2" />
                          Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 cursor-pointer" onClick={() => router.push(`/forums/${thread.id}`)}>
                    <h3 className="text-lg md:text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-snug">
                      {thread.title}
                    </h3>
                    <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
                      {thread.content}
                    </p>
                  </div>

                  {thread.tags && thread.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4" role="list">
                      {thread.tags.map((tag: string) => (
                        <span key={tag} className="text-[10px] font-bold text-primary/70 hover:text-primary transition-colors cursor-pointer">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/5">
                    <div className="flex items-center gap-4">
                      <button
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => router.push(`/forums/${thread.id}`)}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {thread.replies ? thread.replies[0]?.count : 0}
                        </span>
                      </button>
                      <div className="flex items-center gap-1.5 text-muted-foreground/60">
                        <Eye className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {thread.viewCount || 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 italic">
                        {thread.isAnonymous ? "Anonymous Source" : "Verified ID"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-full px-8"
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Load More
              </Button>
            </div>
          )}
        </div>
      )
      }
    </div >
  );
}

