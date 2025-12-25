
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";

export function TrendChart({ refreshKey }: { refreshKey?: number }) {
  const [data, setData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const max = 5;

  useEffect(() => {
    const fetchMoods = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
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
        console.error("Error fetching mood history:", error);
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
    <Card className="p-6 bg-card/40 backdrop-blur-sm border-border/50 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-foreground">Weekly Mood Trend</h3>
        <select className="text-xs bg-background/50 border-none rounded-lg p-1 text-muted-foreground outline-none">
          <option>This Week</option>
        </select>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-2 h-40">
          {data.map((value, index) => {
            const heightPercentage = value === 0 ? 5 : (value / max) * 100; // Min height for visibility
            const day = days[index];

            // Color logic based on score
            let barColor = "bg-muted";
            if (value === 0) barColor = "bg-muted/30";
            else if (value <= 2) barColor = "bg-red-500/50";
            else if (value === 3) barColor = "bg-yellow-500/50";
            else barColor = "bg-green-500/50";

            return (
              <div key={index} className="flex flex-col items-center gap-2 w-full group">
                <div className="relative w-full flex items-end justify-center h-full">
                  <div
                    className={`w-full max-w-[24px] rounded-t-lg transition-all duration-500 group-hover:opacity-80 ${barColor}`}
                    style={{ height: `${heightPercentage}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] py-1 px-2 rounded shadow-sm whitespace-nowrap transition-opacity pointer-events-none">
                      {value === 0 ? "No Log" : `Score: ${value}/5`}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{day}</span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  );
}
