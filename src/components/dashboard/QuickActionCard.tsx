import { cn } from "@/lib/utils";
import { LucideIcon, ArrowRight, ChevronRight } from "lucide-react";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  variant?: "rose" | "amber" | "mint" | "lavender" | "sky" | "peach";
  onClick?: () => void;
}

const variantStyles = {
  rose: "bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30 hover:border-rose-300 dark:hover:border-rose-700",
  amber: "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 hover:border-amber-300 dark:hover:border-amber-700",
  mint: "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-700",
  lavender: "bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-900/30 hover:border-violet-300 dark:hover:border-violet-700",
  sky: "bg-sky-50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-900/30 hover:border-sky-300 dark:hover:border-sky-700",
  peach: "bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30 hover:border-orange-300 dark:hover:border-orange-700",
};

const iconStyles = {
  rose: "text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300 group-hover:bg-rose-600 group-hover:text-white",
  amber: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 group-hover:bg-amber-600 group-hover:text-white",
  mint: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white",
  lavender: "text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300 group-hover:bg-violet-600 group-hover:text-white",
  sky: "text-sky-600 bg-sky-100 dark:bg-sky-900/30 dark:text-sky-300 group-hover:bg-sky-600 group-hover:text-white",
  peach: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300 group-hover:bg-orange-600 group-hover:text-white",
};

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  variant = "sky",
  onClick,
}: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-300 hover:shadow-md active:scale-[0.98]",
        variantStyles[variant]
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 shadow-sm",
          iconStyles[variant]
        )}
      >
        <Icon className="h-6 w-6" />
      </div>

      <div className="flex-1 min-w-0 py-0.5">
        <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-0.5">
          {description}
        </p>
      </div>

      <div className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-muted-foreground/50">
        <ChevronRight className="h-5 w-5" />
      </div>
    </button>
  );
}
