import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function InsightCard({ refreshKey }: { refreshKey?: number }) {
  const [tip, setTip] = useState<{ title: string; message: string; action: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestMood = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTip({
          title: "Sign in to unlock insights",
          message: "Your personalized wellness insights appear once you log in and start check-ins.",
          action: "Log In"
        });
        setLoading(false);
        return;
      }

      const { data: logs } = await supabase
        .from('MoodLog')
        .select('moodScore')
        .eq('userId', user.id)
        .order('loggedAt', { ascending: false })
        .limit(7);

      if (logs && logs.length > 0) {
        const latestScore = logs[0].moodScore;
        const avg = logs.reduce((sum, item) => sum + (item.moodScore ?? 0), 0) / logs.length;
        setTip(getTipForScore(latestScore, avg));
      } else {
        setTip({
          title: "Welcome to Wellness",
          message: "Start tracking your mood to get personalized insights and tips for your mental health journey.",
          action: "Start Logging"
        });
      }
      setLoading(false);
    };

    fetchLatestMood();
  }, [refreshKey]);

  const getTipForScore = (score: number, weeklyAverage: number) => {
    if (score <= 2) { // Stressed/Anxious
      return {
        title: "Take a Breather",
        message: `It seems like things are tough right now. Your recent average is ${weeklyAverage.toFixed(1)}/5. Try a short breathing exercise or reach out to a trusted person today.`,
        action: "Try 5-min Meditation"
      };
    } else if (score === 3) { // Okay
      return {
        title: "Keep Going",
        message: `You're doing okay with a recent average of ${weeklyAverage.toFixed(1)}/5. Consistency is key—try a light walk to nudge your mood upward.`,
        action: "View Relaxation Tips"
      };
    } else { // Good/Great
      return {
        title: "Great Job!",
        message: `You're feeling good and averaging ${weeklyAverage.toFixed(1)}/5 recently. Capitalize on this energy to tackle your goals or support a friend.`,
        action: "View Study Goals"
      };
    }
  };

  const scoreColor =
    tip?.title === "Take a Breather" ? "from-rose-500/15 via-card/40 to-card/40 border-rose-500/20 text-rose-400" :
    tip?.title === "Keep Going" ? "from-amber-500/15 via-card/40 to-card/40 border-amber-500/20 text-amber-400" :
    "from-emerald-500/15 via-card/40 to-card/40 border-emerald-500/20 text-emerald-400";

  const iconBg =
    tip?.title === "Take a Breather" ? "bg-rose-500/10 text-rose-500" :
    tip?.title === "Keep Going" ? "bg-amber-500/10 text-amber-500" :
    "bg-emerald-500/10 text-emerald-500";

  if (loading) {
    return (
      <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-8">
        <div className="flex items-center justify-center text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs font-bold italic">Loading insight…</span>
        </div>
      </div>
    );
  }

  if (!tip) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${scoreColor} backdrop-blur-xl border rounded-[2.5rem] p-8 relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Sparkles className="h-28 w-28" />
      </div>
      <div className="relative">
        <div className="flex items-center gap-4 mb-5">
          <div className={`p-3 rounded-2xl shrink-0 ${iconBg}`}>
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">AI Insight</p>
            <h3 className="font-black text-xl italic tracking-tight">{tip.title}</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed italic mb-6">{tip.message}</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-11 rounded-2xl font-black italic tracking-tighter text-xs border-border/40">
            View Tips
          </Button>
          <Button className={`flex-1 h-11 rounded-2xl font-black italic tracking-tighter text-xs flex items-center justify-center gap-2 text-white shadow-xl`}
            style={{ background: tip.title === 'Take a Breather' ? 'linear-gradient(135deg, #f43f5e, #e11d48)' : tip.title === 'Keep Going' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            {tip.action} <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
