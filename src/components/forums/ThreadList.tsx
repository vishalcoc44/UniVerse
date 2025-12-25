
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowBigDown, ArrowBigUp, Flag, MessageSquare, Share2, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

import { useUserUniversity } from "@/hooks/useUserUniversity";

export function ThreadList({ activeCategory, scope = 'campus' }: { activeCategory?: string, scope?: 'campus' | 'universe' }) {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { universityId, loading: uniLoading } = useUserUniversity();

  useEffect(() => {
    if (uniLoading) return;
    const fetchThreads = async () => {
      setLoading(true);

      let query = supabase
        .from('ForumThread')
        .select(`
            *,
            replies:ForumReply(count)
        `)
        .order('createdAt', { ascending: false });

      if (scope === 'campus') {
        if (universityId) {
          query = query.eq('scope', 'CAMPUS').eq('universityId', universityId);
        } else {
          query = query.eq('scope', 'CAMPUS').is('universityId', null); // Fallback if no uni? Or show nothing? Default behavior: check null or block? Safe to just default to Campus.
        }
      } else {
        query = query.eq('scope', 'UNIVERSE');
      }

      if (activeCategory && activeCategory !== 'all') {
        // Simple string match for legacy category field or if we strictly use string
        query = query.eq('category', activeCategory);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching threads:", error);
      } else {
        setThreads(data || []);
      }
      setLoading(false);
    };

    fetchThreads();
  }, [activeCategory, scope, universityId, uniLoading]);

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
          <Card key={thread.id} className="flex overflow-hidden transition-all hover:border-primary/20 bg-card/60 backdrop-blur-sm border-border/50">
            {/* Voting Column (Mock for now as schema lacks upvotes) */}
            <div className="w-12 bg-muted/20 flex flex-col items-center p-2 gap-1 border-r border-border/50">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10">
                <ArrowBigUp className="h-6 w-6" />
              </Button>
              <span className="text-sm font-bold text-muted-foreground">?</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10">
                <ArrowBigDown className="h-6 w-6" />
              </Button>
            </div>

            {/* Content Column */}
            <div className="flex-1 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                <Badge variant="outline" className="bg-secondary/50 font-normal border-border">
                  {thread.category || "General"}
                </Badge>
                <span>• Posted by {thread.isAnonymous ? "Anonymous" : "User"}</span>
                <span>• {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-1 leading-snug">
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
