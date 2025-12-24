import { Card } from "@/components/ui/card";

export function TrendChart() {
  // Simple mock data for 7 days
  const data = [3, 4, 2, 5, 4, 3, 5]; // 1-5 scale
  const max = 5;

  return (
    <Card className="p-6 bg-card/40 backdrop-blur-sm border-border/50 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-foreground">Weekly Mood Trend</h3>
        <select className="text-xs bg-background/50 border-none rounded-lg p-1 text-muted-foreground outline-none">
          <option>This Week</option>
          <option>Last Week</option>
        </select>
      </div>

      <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-2 h-40">
        {data.map((value, index) => {
          const heightPercentage = (value / max) * 100;
          const day = ["M", "T", "W", "T", "F", "S", "S"][index];

          // Color logic based on score
          let barColor = "bg-primary/50";
          if (value <= 2) barColor = "bg-red-500/50";
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
                    Score: {value}/5
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{day}</span>
            </div>
          )
        })}
      </div>
    </Card>
  );
}
