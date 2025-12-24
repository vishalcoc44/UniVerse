import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MoodSelector } from "@/components/wellness/MoodSelector";
import { TrendChart } from "@/components/wellness/TrendChart";
import { InsightCard } from "@/components/wellness/InsightCard";
import { Card } from "@/components/ui/card";
import { Flame, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const Wellness = () => {
    return (
        <DashboardLayout
            title="Mental Wellness"
            subtitle="Prioritize your peace of mind."
            breadcrumb={["UniVerse", "Wellness"]}
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Interaction Area */}
                <div className="lg:col-span-2 space-y-6">
                    <MoodSelector />
                    <InsightCard />
                </div>

                {/* Sidebar Stats & Tools */}
                <div className="space-y-6">
                    <Card className="p-6 bg-card/40 border-border/50 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Mindfulness Streak</p>
                            <h3 className="text-3xl font-bold font-mono">12 Days</h3>
                        </div>
                        <div className="h-14 w-14 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 animate-pulse">
                            <Flame className="h-8 w-8 fill-current" />
                        </div>
                    </Card>

                    <div className="h-[250px]">
                        <TrendChart />
                    </div>

                    <Card className="p-4 bg-red-500/5 border-red-500/20">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-500/10 rounded-full text-red-500">
                                <Phone className="h-4 w-4" />
                            </div>
                            <h4 className="font-semibold text-red-700 dark:text-red-400">Crisis Support</h4>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                            If you're feeling overwhelmed, confidential help is available 24/7.
                        </p>
                        <Button className="w-full bg-red-600 hover:bg-red-700 text-white" size="sm">
                            Get Help Now
                        </Button>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Wellness;
