import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface UpcomingItemProps {
  code: string;
  title: string;
  date: string;
  time: string;
  daysLeft: number;
  variant?: "rose" | "amber" | "mint" | "lavender" | "sky" | "peach";
}

const variantBg = {
  rose: "bg-pastel-rose",
  amber: "bg-pastel-amber",
  mint: "bg-pastel-mint",
  lavender: "bg-pastel-lavender",
  sky: "bg-pastel-sky",
  peach: "bg-pastel-peach",
};

const variantText = {
  rose: "text-pastel-rose-dark",
  amber: "text-pastel-amber-dark",
  mint: "text-pastel-mint-dark",
  lavender: "text-pastel-lavender-dark",
  sky: "text-pastel-sky-dark",
  peach: "text-pastel-peach-dark",
};

export function UpcomingItem({
  code,
  title,
  date,
  time,
  daysLeft,
  variant = "mint",
}: UpcomingItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:shadow-elevated",
        variantBg[variant]
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-14 h-10 rounded-lg bg-card/60 font-bold text-xs shadow-sm shrink-0",
          variantText[variant]
        )}
      >
        {code}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground truncate">{title}</h4>
        <p className="text-sm text-muted-foreground">
          {date} • {time}
        </p>
      </div>
      <Badge
        variant="secondary"
        className={cn(
          "text-xs whitespace-nowrap",
          daysLeft <= 2 ? "bg-destructive/10 text-destructive" : variantText[variant]
        )}
      >
        {daysLeft} {daysLeft === 1 ? "Day" : "Days"} left
      </Badge>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}
