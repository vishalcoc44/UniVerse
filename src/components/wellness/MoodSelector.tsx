import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Smile, Frown, Meh, Angry } from "lucide-react"; // Fallback icons, we'll use emojis mainly

const MOODS = [
  { emoji: "😖", label: "Stressed", color: "bg-red-500/10 text-red-500 hover:bg-red-500/20" },
  { emoji: "😕", label: "Anxious", color: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20" },
  { emoji: "😐", label: "Okay", color: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20" },
  { emoji: "🙂", label: "Good", color: "bg-green-500/10 text-green-500 hover:bg-green-500/20" },
  { emoji: "🤩", label: "Great", color: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" },
];

export function MoodSelector() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  return (
    <Card className="p-6 bg-card/40 backdrop-blur-sm border-border/50">
      <h3 className="text-lg font-semibold mb-4 text-center">How are you feeling today?</h3>
      <div className="flex justify-between items-center gap-2">
        {MOODS.map((mood, index) => (
          <button
            key={index}
            onClick={() => setSelectedMood(index)}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 w-full group",
              selectedMood === index
                ? "transform scale-110 bg-background shadow-md ring-2 ring-primary/20 " + mood.color.replace("hover:", "")
                : "hover:scale-105 " + mood.color
            )}
          >
            <span className={cn(
              "text-2xl filter transition-all duration-300",
              selectedMood === index ? "grayscale-0" : "grayscale-[0.5] group-hover:grayscale-0"
            )}>
              {mood.emoji}
            </span>
            <span className="text-[10px] font-medium opacity-70 group-hover:opacity-100">{mood.label}</span>
          </button>
        ))}
      </div>

      {selectedMood !== null && (
        <div className="mt-6 animate-in fade-in slide-in-from-top-2">
          <textarea
            className="w-full bg-background/50 rounded-xl p-3 text-sm border-none focus:ring-1 focus:ring-primary/20 resize-none min-h-[80px]"
            placeholder="Want to journal about it? (Private & Encrypted)"
          />
          <Button size="sm" className="mt-2 w-full bg-primary/90 hover:bg-primary">
            Log Entry
          </Button>
        </div>
      )}
    </Card>
  );
}
