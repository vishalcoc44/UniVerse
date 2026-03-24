'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  reputationPoints: number;
  department: string | null;
}

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from('Profile')
        .select('universityId')
        .eq('id', user.id)
        .single();

      if (!profile?.universityId) { setLoading(false); return; }

      const { data } = await supabase
        .from('Profile')
        .select('id, fullName, avatarUrl, reputationPoints, department')
        .eq('universityId', profile.universityId)
        .order('reputationPoints', { ascending: false })
        .limit(10);

      if (data) {
        setEntries(data);
        const rank = data.findIndex(e => e.id === user.id);
        setMyRank(rank >= 0 ? rank + 1 : null);
      }
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Campus Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No leaderboard data yet</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-xl transition-colors",
                  entry.id === currentUserId && "bg-primary/10 border border-primary/20",
                  i < 3 && "bg-muted/30"
                )}
              >
                <div className="w-6 flex justify-center">{getRankIcon(i + 1)}</div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={entry.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs">{entry.fullName?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{entry.fullName}</p>
                  {entry.department && <p className="text-[10px] text-muted-foreground truncate">{entry.department}</p>}
                </div>
                <Badge variant="outline" className="text-xs font-bold shrink-0">
                  {entry.reputationPoints} pts
                </Badge>
              </div>
            ))}
            {myRank && myRank > 10 && (
              <div className="text-center text-xs text-muted-foreground pt-2">
                Your rank: #{myRank}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
