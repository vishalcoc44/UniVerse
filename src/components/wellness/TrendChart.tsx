
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Loader2, TrendingUp } from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function TrendChart({ refreshKey }: { refreshKey?: number }) {
  const [data, setData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const max = 5;

  useEffect(() => {
    const fetchMoods = async () => {
      setLoading(true);
      setErrorMessage("");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorMessage("Sign in to view mood trends.");
        setLoading(false);
        return;
      }

      // Fetch last 7 days of moods
      const today = new Date();
      const sevenDaysAgo = subDays(today, 6); // To include today, go back 6

      const { data: logs, error } = await supabase
        .from('MoodLog')
        .select('moodScore, loggedAt')
        .eq('userId', user.id)
        .gte('loggedAt', sevenDaysAgo.toISOString())
        .order('loggedAt', { ascending: true });

      if (error) {
        console.error("Error fetching mood history:", error.message || error);
        setErrorMessage("Could not load trend data.");
      } else {
        // Process data to fill the last 7 days slots
        // Strategy: For each of the last 7 days, find the LAST logged mood
        // If no mood logged that day, use 0 or previous day (let's use 0 for empty)

        const chartData: number[] = [];
        for (let i = 6; i >= 0; i--) {
          const targetDate = subDays(today, i);
          // Find logs for this specific day
          const dayLogs = logs?.filter(log => isSameDay(new Date(log.loggedAt), targetDate));

          if (dayLogs && dayLogs.length > 0) {
            // Take the latest one for that day
            const latest = dayLogs[dayLogs.length - 1]; // Assuming they assume ascending order
            chartData.push(latest.moodScore);
          } else {
            chartData.push(0);
          }
        }
        setData(chartData);
      }
      setLoading(false);
    };

    fetchMoods();
  }, [refreshKey]);


  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return format(d, 'EEEEE'); // "M", "T", "W"...
  });

  return (
    <div className="p-7 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="h-4 w-4" />
          </div>
          <h3 className="font-black text-sm italic tracking-tight uppercase">Weekly Mood</h3>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Last 7 Days</span>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-muted-foreground h-5 w-5" />
        </div>
      ) : errorMessage ? (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground text-center italic">
          {errorMessage}
        </div>
      ) : data.every((value) => value === 0) ? (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground/60 text-center italic">
          No entries in the last 7 days.
        </div>
      ) : (
        <div className="flex items-end justify-between gap-1.5 px-1 pb-1" style={{ height: '140px' }}>
          {data.map((value, index) => {
            const heightPercentage = value === 0 ? 4 : (value / max) * 100;
            const day = days[index];

            const gradient =
              value === 0 ? "bg-muted/20" :
              value <= 2 ? "bg-gradient-to-t from-red-500 to-red-400" :
              value === 3 ? "bg-gradient-to-t from-yellow-500 to-amber-400" :
              "bg-gradient-to-t from-emerald-500 to-green-400";

            return (
              <div key={index} className="flex flex-col items-center gap-2 w-full h-full group">
                <div className="relative w-full h-full flex items-end justify-center">
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: `${heightPercentage}%`, opacity: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.07, ease: 'easeOut' }}
                    className={cn(
                      "w-full max-w-[18px] rounded-t-full shadow-sm",
                      gradient,
                      value > 0 && "shadow-lg"
                    )}
                  />
                  {value > 0 && (
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-popover/90 backdrop-blur text-popover-foreground text-[9px] font-bold py-1 px-2 rounded-xl shadow whitespace-nowrap transition-opacity pointer-events-none border border-border/30">
                      {value}/5
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground/60 font-black uppercase">{day}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
