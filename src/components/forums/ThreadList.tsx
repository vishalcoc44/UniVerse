
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowBigDown, ArrowBigUp, Flag, MessageSquare, Share2, Loader2, Trash2, Eye, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

import { useUserUniversity } from "@/hooks/useUserUniversity";

export function ThreadList({ activeCategory, scope = 'campus', sortBy = 'latest' }: { activeCategory?: string, scope?: 'campus' | 'universe', sortBy?: 'latest' | 'trending' }) {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const { universityId, loading: uniLoading } = useUserUniversity();

  const fetchThreads = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

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
        query = query.eq('scope', 'CAMPUS').is('universityId', null);
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

  return (
    <div className="space-y-4 min-h-[200px]">
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground bg-card/40 rounded-xl">
          No threads found in this category. Be the first to post!
        </div>
      ) : (
        threads.map((thread) => (
          <Card key={thread.id} className={cn(
            "flex overflow-hidden transition-all hover:border-primary/20 bg-card/60 backdrop-blur-sm border-border/50",
            thread.isPinned && "border-primary/30 bg-primary/5"
          )}>
            {/* Voting Column */}
            <div className="w-12 bg-muted/20 flex flex-col items-center p-2 gap-1 border-r border-border/50">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-8 w-8 hover:bg-orange-500/10",
                  userVotes[thread.id] === 1 ? "text-orange-500" : "text-muted-foreground"
                )}
                onClick={() => handleVote(thread.id, 1)}
              >
                <ArrowBigUp className="h-6 w-6" />
              </Button>
              <span className="text-sm font-bold">{thread.totalVotes}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-8 w-8 hover:bg-blue-500/10",
                  userVotes[thread.id] === -1 ? "text-blue-500" : "text-muted-foreground"
                )}
                onClick={() => handleVote(thread.id, -1)}
              >
                <ArrowBigDown className="h-6 w-6" />
              </Button>
            </div>

            {/* Content Column */}
            <div className="flex-1 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 flex-wrap">
                {thread.isPinned && (
                  <Badge variant="default" className="text-[10px] h-4 px-1 gap-1">
                    PINNED
                  </Badge>
                )}
                <Badge variant="outline" className="bg-secondary/50 font-normal border-border">
                  {thread.category || "General"}
                </Badge>
                {thread.tags?.map((tag: string) => (
                   <Badge key={tag} variant="secondary" className="text-[10px] h-4 px-1 gap-1">
                     <Tag className="h-2 w-2" />
                     {tag}
                   </Badge>
                ))}
                <span>• Posted by {thread.isAnonymous ? (
                    <span className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: `hsl(${thread.authorId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % 360}, 70%, 50%)` }} />
                        Anonymous
                    </span>
                ) : "User"}</span>
                <span>• {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-1 leading-snug flex items-center gap-2">
                {thread.title}
              </h3>
              <p className="text-sm text-muted-foreground/90 line-clamp-3 mb-3 whitespace-pre-wrap">
                {thread.content}
              </p>

              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground gap-1.5 hover:text-foreground">
                  <MessageSquare className="h-4 w-4" />
                  {thread.replies ? thread.replies[0]?.count : 0} Comments
                </Button>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  {thread.viewCount || 0}
                </div>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground gap-1.5 hover:text-foreground">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground gap-1.5 hover:text-red-500 hover:bg-red-500/10 ml-auto">
                  <Flag className="h-3 w-3" />
                  Report
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

