import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: "rose" | "amber" | "mint" | "lavender" | "sky" | "peach";
}

const variantStyles = {
  rose: "from-rose-500/10 to-rose-500/5 text-rose-700 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/50",
  amber: "from-amber-500/10 to-amber-500/5 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/50",
  mint: "from-emerald-500/10 to-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/50",
  lavender: "from-violet-500/10 to-violet-500/5 text-violet-700 dark:text-violet-400 border-violet-200/50 dark:border-violet-900/50",
  sky: "from-sky-500/10 to-sky-500/5 text-sky-700 dark:text-sky-400 border-sky-200/50 dark:border-sky-900/50",
  peach: "from-orange-500/10 to-orange-500/5 text-orange-700 dark:text-orange-400 border-orange-200/50 dark:border-orange-900/50",
};

const iconBgStyles = {
  rose: "bg-rose-500 text-white shadow-rose-500/20",
  amber: "bg-amber-500 text-white shadow-amber-500/20",
  mint: "bg-emerald-500 text-white shadow-emerald-500/20",
  lavender: "bg-violet-500 text-white shadow-violet-500/20",
  sky: "bg-sky-500 text-white shadow-sky-500/20",
  peach: "bg-orange-500 text-white shadow-orange-500/20",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "sky",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-gradient-to-br",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg shadow-lg",
                iconBgStyles[variant]
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium opacity-80">{title}</p>
          </div>

          <div className="space-y-0.5">
            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
            {subtitle && (
              <p className="text-xs font-medium opacity-60 mix-blend-multiply dark:mix-blend-screen">
                {subtitle}
              </p>
            )}
          </div>

          {trend && (
            <div className="flex items-center gap-1.5 pt-1">
              <span
                className={cn(
                  "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold bg-white/50 dark:bg-black/20 backdrop-blur-sm",
                  trend.positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}
              >
                {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trend.value}%
              </span>
              <span className="text-[10px] opacity-60 font-medium">vs last week</span>
            </div>
          )}
        </div>
      </div>

      {/* Decorative background circle */}
      <div className={cn(
        "absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 blur-xl",
        iconBgStyles[variant]
      )} />
    </div>
  );
}
