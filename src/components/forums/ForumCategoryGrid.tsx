import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Coffee, GraduationCap, HelpCircle, UserPlus, FileText, Sparkles, TrendingUp, Zap, Ghost } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUserUniversity } from "@/hooks/useUserUniversity";

interface Category {
  id: string;
  name: string;
  count: string;
  icon: any;
  color: string;
  description: string;
}

interface ForumCategoryGridProps {
  onSelect: (id: string) => void;
  activeId: string;
}

export const FORUM_CATEGORIES = [
  { id: "general", name: "General Discussion", icon: Sparkles, color: "text-amber-500", description: "Everything and anything" },
  { id: "confidential", name: "Confidential", icon: Ghost, color: "text-emerald-500", description: "Sensitive & anonymous" },
  { id: "cs", name: "Computer Science", icon: Zap, color: "text-blue-500", description: "Tech & coding" },
  { id: "campus", name: "Campus Life", icon: Coffee, color: "text-rose-500", description: "Student experiences" },
  { id: "admissions", name: "New Students", icon: UserPlus, color: "text-purple-500", description: "Getting started" },
  { id: "help", name: "Help & Support", icon: HelpCircle, color: "text-cyan-500", description: "Questions & answers" },
];

export function ForumCategoryGrid({ onSelect, activeId }: ForumCategoryGridProps) {
  const { universityId } = useUserUniversity();
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryCounts = async () => {
      setLoading(true);
      try {
        const counts: Record<string, number> = {};

        // Fetch counts for each category
        for (const cat of FORUM_CATEGORIES) {
          const { count } = await supabase
            .from("ForumThread")
            .select("id", { count: "exact", head: true })
            .eq("scope", "CAMPUS")
            .eq("universityId", universityId)
            .eq("category", cat.id);

          counts[cat.id] = count || 0;
        }

        setCategoryCounts(counts);
      } catch (error) {
        console.error("Error fetching category counts:", error);
      } finally {
        setLoading(false);
      }
    };

    if (universityId) {
      fetchCategoryCounts();
    }
  }, [universityId]);

  const formatCount = (count: number): string => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const categories: Category[] = FORUM_CATEGORIES.map((cat) => ({
    ...cat,
    count: formatCount(categoryCounts[cat.id] || 0),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((cat, index) => (
        <motion.button
          key={cat.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "relative group overflow-hidden flex flex-col items-start p-8 rounded-[2.5rem] border transition-all duration-500 text-left",
            activeId === cat.id
              ? "bg-primary/10 border-primary shadow-2xl shadow-primary/10 -translate-y-1"
              : "bg-card/40 backdrop-blur-xl border-border/50 hover:border-primary/30 hover:bg-card/60 hover:-translate-y-1"
          )}
        >
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
            <cat.icon className="h-24 w-24 rotate-12" />
          </div>

          <div className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 shadow-inner bg-card/80 border border-border/30 group-hover:scale-110 group-hover:rotate-3",
            cat.color
          )}>
            <cat.icon className="h-6 w-6" />
          </div>

          <div className="space-y-1 relative z-10">
            <h4 className="text-xl font-black italic tracking-tighter text-foreground group-hover:text-primary transition-colors">
              {cat.name}
            </h4>
            <p className="text-xs font-black italic uppercase tracking-widest text-muted-foreground/60">
              {cat.description}
            </p>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black italic tracking-widest uppercase text-muted-foreground">
              {cat.count} ACTIVE THREADS
            </span>
          </div>

          {activeId === cat.id && (
            <motion.div 
              layoutId="activeCategoryGlow"
              className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" 
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}
