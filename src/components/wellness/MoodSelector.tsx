
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    if ("message" in error && typeof (error as { message: unknown }).message === "string") {
      return (error as { message: string }).message;
    }
    if ("error" in error && typeof (error as { error: unknown }).error === "string") {
      return (error as { error: string }).error;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

const MOODS = [
  { emoji: "😖", label: "Stressed", score: 1, ring: "ring-red-500/40", glow: "shadow-red-500/20", bg: "bg-red-500/10", text: "text-red-500" },
  { emoji: "😕", label: "Anxious",  score: 2, ring: "ring-orange-500/40", glow: "shadow-orange-500/20", bg: "bg-orange-500/10", text: "text-orange-500" },
  { emoji: "😐", label: "Okay",     score: 3, ring: "ring-yellow-500/40", glow: "shadow-yellow-500/20", bg: "bg-yellow-500/10", text: "text-yellow-500" },
  { emoji: "🙂", label: "Good",     score: 4, ring: "ring-green-500/40",  glow: "shadow-green-500/20",  bg: "bg-green-500/10",  text: "text-green-500" },
  { emoji: "🤩", label: "Great",    score: 5, ring: "ring-emerald-500/40", glow: "shadow-emerald-500/20", bg: "bg-emerald-500/10", text: "text-emerald-500" },
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

      const { error } = await supabase.from('MoodLog').insert({
        id: crypto.randomUUID(),
        userId: user.id,
        moodScore: mood.score,
        notes: notes,
        activities: selectedActivities,
        loggedAt: new Date().toISOString()
      });

      if (error) {
        console.warn("Insert with activities failed, retrying without...", error);
        const { error: retryError } = await supabase.from('MoodLog').insert({
          id: crypto.randomUUID(),
          userId: user.id,
          moodScore: mood.score,
          notes: notes,
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
      const msg = getErrorMessage(error);
      console.error("Error logging mood:", msg);
      toast.error(msg || "Failed to log mood.");
    } finally {
      setLoading(false);
    }
  };

  const selected = selectedMoodIndex !== null ? MOODS[selectedMoodIndex] : null;

  return (
    <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-xl italic tracking-tight uppercase">Daily Check-in</h3>
          <p className="text-xs text-muted-foreground mt-0.5">How are you feeling right now?</p>
        </div>
        {selected && (
          <motion.div
            key={selected.label}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn("px-4 py-1.5 rounded-2xl font-black text-xs uppercase tracking-widest", selected.bg, selected.text)}
          >
            {selected.label}
          </motion.div>
        )}
      </div>

      {/* Mood Buttons */}
      <div className="flex items-center justify-between gap-3">
        {MOODS.map((mood, index) => (
          <button
            key={index}
            onClick={() => setSelectedMoodIndex(index)}
            className={cn(
              "flex flex-col items-center gap-2.5 p-4 rounded-[1.5rem] transition-all duration-300 w-full group border border-border/30",
              selectedMoodIndex === index
                ? cn("ring-2 shadow-xl scale-110 bg-card/80", mood.ring, mood.glow, mood.bg)
                : "hover:scale-105 bg-card/20 hover:bg-card/40"
            )}
          >
            <span className={cn(
              "text-3xl transition-all duration-300",
              selectedMoodIndex === index ? "grayscale-0" : "grayscale-[0.3] group-hover:grayscale-0"
            )}>
              {mood.emoji}
            </span>
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest transition-all",
              selectedMoodIndex === index ? mood.text : "text-muted-foreground/60 group-hover:text-muted-foreground"
            )}>
              {mood.label}
            </span>
          </button>
        ))}
      </div>

      {/* Expandable Activity + Notes section */}
      <AnimatePresence>
        {selectedMoodIndex !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-6 pt-2">
              {/* Activities */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-3">What have you been up to?</p>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITIES.map((activity) => (
                    <button
                      key={activity.label}
                      onClick={() => toggleActivity(activity.label)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 border",
                        selectedActivities.includes(activity.label)
                          ? "bg-primary/10 border-primary/40 text-primary shadow-lg shadow-primary/10"
                          : "bg-card/40 border-border/40 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <span>{activity.icon}</span>
                      <span className="uppercase tracking-wider text-[9px] font-black">{activity.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Pencil className="h-3 w-3 text-muted-foreground/60" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Private Journal</p>
                </div>
                <textarea
                  className="w-full bg-background/50 border border-border/30 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none min-h-[90px] text-foreground placeholder:text-muted-foreground/40 transition-all"
                  placeholder="Write about how you're feeling… (Private & Encrypted)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button
                className={cn(
                  "w-full h-12 rounded-2xl font-black italic tracking-tighter text-white shadow-xl transition-all",
                  selected ? cn("bg-gradient-to-r shadow-lg", selected.glow) : "bg-primary"
                )}
                style={selected ? {
                  background: selected.score <= 2 ? "linear-gradient(135deg, #ef4444, #f97316)" :
                              selected.score === 3 ? "linear-gradient(135deg, #eab308, #f97316)" :
                              "linear-gradient(135deg, #22c55e, #10b981)"
                } : undefined}
                onClick={handleLog}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Logging…" : `Log Check-in — ${selected?.emoji} ${selected?.label}`}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
