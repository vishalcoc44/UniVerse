import { Card } from "@/components/ui/card";
import { Lightbulb, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export function InsightCard({ refreshKey }: { refreshKey?: number }) {
  const [tip, setTip] = useState<{ title: string; message: string; action: string } | null>(null);

  useEffect(() => {
    const fetchLatestMood = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: logs } = await supabase
        .from('MoodLog')
        .select('moodScore')
        .eq('userId', user.id)
        .order('loggedAt', { ascending: false })
        .limit(1);

      if (logs && logs.length > 0) {
        const score = logs[0].moodScore;
        setTip(getTipForScore(score));
      } else {
        setTip({
          title: "Welcome to Wellness",
          message: "Start tracking your mood to get personalized insights and tips for your mental health journey.",
          action: "Start Logging"
        });
      }
    };

    fetchLatestMood();
  }, [refreshKey]);

  const getTipForScore = (score: number) => {
    if (score <= 2) { // Stressed/Anxious
      return {
        title: "Take a Breather",
        message: "It seems like things are tough right now. Consider a short breathing exercise or reaching out to a friend.",
        action: "Try 5-min Meditation"
      };
    } else if (score === 3) { // Okay
      return {
        title: "Keep Going",
        message: "You're doing okay. Consistency is key. Maybe try a light walk to boost your mood further.",
        action: "View Relaxation Tips"
      };
    } else { // Good/Great
      return {
        title: "Great Job!",
        message: "You're feeling good! Capitalize on this energy to tackle your goals or help a friend.",
        action: "View Study Goals"
      };
    }
  };

  if (!tip) return null;

  return (
    <Card className="p-1 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/20">
      <div className="p-5 backdrop-blur-sm rounded-xl">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-600 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">{tip.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tip.message}
            </p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" className="text-xs h-8 bg-background/50">
                View Tips
              </Button>
              <Button size="sm" className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                {tip.action}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
