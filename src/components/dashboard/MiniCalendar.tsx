import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  hasEvent?: boolean;
  isToday?: boolean;
  eventColor?: "rose" | "amber" | "mint" | "lavender";
}

export function MiniCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  const getDaysInMonth = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: CalendarDay[] = [];

    // Days from previous month
    const startPadding = (firstDay.getDay() + 6) % 7;
    const prevMonth = new Date(year, month, 0);
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({
        day: prevMonth.getDate() - i,
        isCurrentMonth: false,
      });
    }

    // Days in current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const isToday =
        today.getDate() === i &&
        today.getMonth() === month &&
        today.getFullYear() === year;

      // Mock events
      const hasEvent = [5, 9, 12, 14, 19, 20, 26, 27, 28, 29, 30].includes(i);
      const eventColors: ("rose" | "amber" | "mint" | "lavender")[] = ["rose", "amber", "mint", "lavender"];

      days.push({
        day: i,
        isCurrentMonth: true,
        isToday,
        hasEvent,
        eventColor: hasEvent ? eventColors[i % eventColors.length] : undefined,
      });
    }

    // Days from next month
    const endPadding = 42 - days.length;
    for (let i = 1; i <= endPadding; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const days = getDaysInMonth(currentDate);

  const eventDotColors = {
    rose: "bg-pastel-rose-dark",
    amber: "bg-pastel-amber-dark",
    mint: "bg-pastel-mint-dark",
    lavender: "bg-pastel-lavender-dark",
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={goToPrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-foreground text-sm">
            {MONTHS[currentDate.getMonth()]}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={goToNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" className="h-6 text-xs gap-1">
          <Filter className="h-3 w-3" />
          Filter
          <Badge variant="secondary" className="h-3.5 w-3.5 p-0 text-[9px] flex items-center justify-center">
            1
          </Badge>
        </Button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-medium text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <button
            key={index}
            className={cn(
              "relative flex items-center justify-center h-8 w-full rounded-md text-xs transition-colors",
              day.isCurrentMonth
                ? "text-foreground hover:bg-muted"
                : "text-muted-foreground/40",
              day.isToday && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {day.day}
            {day.hasEvent && !day.isToday && day.eventColor && (
              <span
                className={cn(
                  "absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
                  eventDotColors[day.eventColor]
                )}
              />
            )}
          </button>
        ))}
      </div>

      {/* Events Summary */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">9</span> Events this month
        </p>
      </div>
    </div>
  );
}
