import { Card } from "@/components/ui/card";
import { Lightbulb, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InsightCard() {
  return (
    <Card className="p-1 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/20">
      <div className="p-5 backdrop-blur-sm rounded-xl">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-600 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">Weekly Insight</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You've been reporting higher stress on Sundays. Consider scheduling your study sessions earlier in the weekend to free up Sunday evenings for relaxation.
            </p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" className="text-xs h-8 bg-background/50">
                View Tips
              </Button>
              <Button size="sm" className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                Try 5-min Meditation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
