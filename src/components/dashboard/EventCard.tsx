import { cn } from "@/lib/utils";
import { Calendar, Clock, MapPin, Users, CheckCircle2, Trash2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EventCardProps {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string; // Keep simple string for display
  location: string;
  attendees: number;
  imageUrl?: string | null;
  variant?: "rose" | "amber" | "mint" | "lavender" | "sky" | "peach";
  status?: "upcoming" | "live" | "ended";
  isOrganizer?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onViewAttendees?: (id: string) => void;
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
  id,
  title,
  type,
  date,
  time,
  location,
  attendees,
  imageUrl,
  variant = "sky",
  status = "upcoming",
  isOrganizer,
  onDelete,
  onEdit,
  onViewAttendees
}: EventCardProps) {
  // Extract day number for the badge (e.g. "Jan 15" -> "15")
  const dayNumber = date.match(/\d+/)?.[0] || "Evt";

  return (
    <div
      className={cn(
        "rounded-3xl overflow-hidden transition-all duration-200 hover:shadow-lg flex flex-col relative group",
        variantStyles[variant]
      )}
    >
      {/* Cover Image */}
      {imageUrl && (
        <div className="h-32 w-full overflow-hidden relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
          <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute top-2 right-2 z-20">
            <div className="bg-white/90 backdrop-blur-md shadow-sm rounded-lg px-2 py-1 text-[10px] font-bold text-foreground">
              {dayNumber}
            </div>
          </div>
        </div>
      )}

      {/* Content Header */}
      <div className={cn("px-3 pt-3 flex flex-col gap-0.5", !imageUrl && "pt-4")}>
        {!imageUrl && (
          <div className="mb-2">
            <div className="bg-white/90 shadow-sm rounded-xl h-8 w-8 flex items-center justify-center font-bold text-xs text-foreground shrink-0 border border-border/50">
              {dayNumber}
            </div>
          </div>
        )}

        <h3 className="font-bold text-foreground text-lg leading-tight line-clamp-2">
          {title}
        </h3>
        <p className="text-xs font-medium opacity-80 flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3 w-3" /> {time}
        </p>
      </div>

      {/* Middle White Box */}
      <div className="px-2 pt-1 pb-2">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2 flex items-center gap-2 shadow-sm">
          <div className="bg-black/5 p-1.5 rounded-lg shrink-0">
            <MapPin className="h-4 w-4 opacity-70" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-xs text-foreground truncate">{type}</p>
            <p className="text-[10px] text-muted-foreground truncate">{location}</p>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="px-3 py-2 bg-black/5 mt-auto flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white py-0.5 px-2 rounded-full shadow-sm">
            <CheckCircle2 className="h-3 w-3 text-status-success" />
            <span className="text-[10px] font-semibold text-foreground">
              {status === 'live' ? 'Live' : 'Confirmed'}
            </span>
          </div>

          <button
            onClick={() => onViewAttendees?.(id)}
            className="flex items-center gap-1.5 bg-white py-0.5 px-2 rounded-full shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Users className="h-3 w-3 text-blue-500" />
            <span className="text-[10px] font-semibold text-foreground">
              {attendees}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isOrganizer && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-blue-500 hover:text-blue-600 hover:bg-blue-100/50"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(id);
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-100/50"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Are you sure you want to delete this event?")) {
                    onDelete?.(id);
                  }
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
          {/* Menu Removed */}
        </div>
      </div>
    </div>
  );
}
