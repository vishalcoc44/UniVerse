import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Coffee, GraduationCap, HelpCircle, UserPlus, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

interface ForumCategoryGridProps {
  onSelect: (id: string) => void;
  activeId: string;
}

export function ForumCategoryGrid({ onSelect, activeId }: ForumCategoryGridProps) {
  const categories: Category[] = [
    { id: "all", name: "All Topics", count: 1250, icon: <BookOpen className="w-5 h-5" />, color: "bg-blue-500/10 text-blue-500" },
    { id: "cs", name: "Computer Science", count: 420, icon: <FileText className="w-5 h-5" />, color: "bg-purple-500/10 text-purple-500" },
    { id: "campus", name: "Campus Life", count: 350, icon: <Coffee className="w-5 h-5" />, color: "bg-orange-500/10 text-orange-500" },
    { id: "admissions", name: "Admissions", count: 180, icon: <UserPlus className="w-5 h-5" />, color: "bg-green-500/10 text-green-500" },
    { id: "exams", name: "Exam Prep", count: 210, icon: <GraduationCap className="w-5 h-5" />, color: "bg-red-500/10 text-red-500" },
    { id: "help", name: "Student Support", count: 90, icon: <HelpCircle className="w-5 h-5" />, color: "bg-cyan-500/10 text-cyan-500" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 hover:shadow-md h-28 group",
            activeId === cat.id
              ? "bg-primary/5 border-primary shadow-sm"
              : "bg-card/50 border-border/50 hover:bg-card/80"
          )}
        >
          <div className={cn(
            "p-2.5 rounded-full mb-2 transition-transform duration-300 group-hover:scale-110",
            cat.color
          )}>
            {cat.icon}
          </div>
          <span className="text-xs font-semibold text-foreground text-center line-clamp-1">{cat.name}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">{cat.count} posts</span>
        </button>
      ))}
    </div>
  );
}
