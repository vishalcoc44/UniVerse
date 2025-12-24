import { cn } from "@/lib/utils";
import { Calendar, Clock, MapPin, Users, MoreHorizontal, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EventCardProps {
  title: string;
  type: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  variant?: "rose" | "amber" | "mint" | "lavender" | "sky" | "peach";
  status?: "upcoming" | "live" | "ended";
}

const variantStyles = {
  rose: "bg-pastel-rose text-pastel-rose-dark",
  amber: "bg-pastel-amber text-pastel-amber-dark",
  mint: "bg-pastel-mint text-pastel-mint-dark",
  lavender: "bg-pastel-lavender text-pastel-lavender-dark",
  sky: "bg-pastel-sky text-pastel-sky-dark",
  peach: "bg-pastel-peach text-pastel-peach-dark",
};

export function EventCard({
  title,
  type,
  date,
  time,
  location,
  attendees,
  variant = "sky",
  status = "upcoming",
}: EventCardProps) {
  // Extract day number for the badge (e.g. "Jan 15" -> "15")
  const dayNumber = date.match(/\d+/)?.[0] || "Evt";

  return (
    <div
      className={cn(
        "rounded-3xl overflow-hidden transition-all duration-200 hover:shadow-lg flex flex-col",
        variantStyles[variant]
      )}
    >
      {/* Top Header Section */}
      <div className="p-4 pb-2 flex gap-3 items-start">
        <div className="bg-white/90 shadow-sm rounded-xl h-10 w-10 flex items-center justify-center font-bold text-sm text-foreground shrink-0">
          {dayNumber}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-base leading-tight truncate">
            {title}
          </h3>
          <p className="text-xs font-medium opacity-80 mt-0.5">
            {time}
          </p>
        </div>
      </div>

      {/* Middle White Box */}
      <div className="px-2 pt-1 pb-3">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 flex items-center gap-3 shadow-sm">
          <div className="bg-black/5 p-2 rounded-xl shrink-0">
            <MapPin className="h-5 w-5 opacity-70" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{type}</p>
            <p className="text-xs text-muted-foreground truncate">{location}</p>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="px-4 py-3 bg-black/5 mt-auto flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-white py-1 px-2.5 rounded-full shadow-sm">
          <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
          <span className="text-[10px] font-semibold text-foreground">
            {status === 'live' ? 'Live' : 'Confirmed'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-white py-1 px-2.5 rounded-full shadow-sm">
          <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
          <span className="text-[10px] font-semibold text-foreground">
            {attendees}
          </span>
        </div>

        <div className="ml-auto">
          <MoreHorizontal className="h-5 w-5 opacity-60 cursor-pointer hover:opacity-100" />
        </div>
      </div>
    </div>
  );
}
