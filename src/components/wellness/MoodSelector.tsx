
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Smile, Frown, Meh, Angry } from "lucide-react"; // Fallback icons, we'll use emojis mainly
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const MOODS = [
  { emoji: "😖", label: "Stressed", score: 1, color: "bg-red-500/10 text-red-500 hover:bg-red-500/20" },
  { emoji: "😕", label: "Anxious", score: 2, color: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20" },
  { emoji: "😐", label: "Okay", score: 3, color: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20" },
  { emoji: "🙂", label: "Good", score: 4, color: "bg-green-500/10 text-green-500 hover:bg-green-500/20" },
  { emoji: "🤩", label: "Great", score: 5, color: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" },
];

interface MoodSelectorProps {
  onLogComplete?: () => void;
}

const ACTIVITIES = [
  { icon: "🏃", label: "Exercise" },
  { icon: "😴", label: "Sleep" },
  { icon: "🤝", label: "Social" },
  { icon: "📚", label: "Study" },
  { icon: "💼", label: "Work" },
  { icon: "🎮", label: "Relax" },
  { icon: "🍽️", label: "Eat" },
  { icon: "🧘", label: "Meditate" },
];

export function MoodSelector({ onLogComplete }: MoodSelectorProps) {
  const [selectedMoodIndex, setSelectedMoodIndex] = useState<number | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleActivity = (activity: string) => {
    setSelectedActivities(prev =>
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const handleLog = async () => {
    if (selectedMoodIndex === null) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to track your mood.");
        return;
      }

      const mood = MOODS[selectedMoodIndex];

      // Try inserting with activities first
      const { error } = await supabase.from('MoodLog').insert({
        userId: user.id,
        moodScore: mood.score,
        notes: notes,
        activities: selectedActivities,
        loggedAt: new Date().toISOString()
      });

      if (error) {
        // If error is 400 (likely bad request due to missing column), try without activities
        console.warn("Insert with activities failed, retrying without...", error);

        const { error: retryError } = await supabase.from('MoodLog').insert({
          userId: user.id,
          moodScore: mood.score,
          notes: notes,
          // activities: skipped
          loggedAt: new Date().toISOString()
        });

        if (retryError) throw retryError;
        toast.info("Mood logged (Activities skipped - DB update required)");
      } else {
        toast.success("Mood logged successfully!");
      }

      setSelectedMoodIndex(null);
      setSelectedActivities([]);
      setNotes("");
      if (onLogComplete) onLogComplete();

    } catch (error) {
      console.error("Error logging mood:", error);
      toast.error("Failed to log mood.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-card/40 backdrop-blur-sm border-border/50">
      <h3 className="text-lg font-semibold mb-4 text-center">How are you feeling today?</h3>
      <div className="flex justify-between items-center gap-2 mb-6">
        {MOODS.map((mood, index) => (
          <button
            key={index}
            onClick={() => setSelectedMoodIndex(index)}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 w-full group",
              selectedMoodIndex === index
                ? "transform scale-110 bg-background shadow-md ring-2 ring-primary/20 " + mood.color.replace("hover:", "")
                : "hover:scale-105 " + mood.color
            )}
          >
            <span className={cn(
              "text-2xl filter transition-all duration-300",
              selectedMoodIndex === index ? "grayscale-0" : "grayscale-[0.5] group-hover:grayscale-0"
            )}>
              {mood.emoji}
            </span>
            <span className="text-[10px] font-medium opacity-70 group-hover:opacity-100">{mood.label}</span>
          </button>
        ))}
      </div>

      {selectedMoodIndex !== null && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">What have you been up to?</label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITIES.map((activity) => (
                <button
                  key={activity.label}
                  onClick={() => toggleActivity(activity.label)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all duration-200 border",
                    selectedActivities.includes(activity.label)
                      ? "bg-primary/10 border-primary/50 text-primary"
                      : "bg-background/50 border-border hover:bg-muted text-muted-foreground"
                  )}
                >
                  <span>{activity.icon}</span>
                  <span>{activity.label}</span>
                </button>
              ))}
            </div>
          </div>

          <textarea
            className="w-full bg-background/50 rounded-xl p-3 text-sm border-none focus:ring-1 focus:ring-primary/20 resize-none min-h-[80px]"
            placeholder="Want to journal about it? (Private & Encrypted)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button size="sm" className="w-full bg-primary/90 hover:bg-primary" onClick={handleLog} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log Entry
          </Button>
        </div>
      )}
    </Card>
  );
}
