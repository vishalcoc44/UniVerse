import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function RideFinder() {
  return (
    <Card className="p-6 bg-card/50 backdrop-blur-md border-border/50 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        Find a Ride
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-normal">Student Verified</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">From & To</label>
          <div className="flex bg-background/50 rounded-lg border border-border/50 overflow-hidden">
            <div className="flex-1 border-r border-border/50">
              <Input className="border-none shadow-none focus-visible:ring-0 rounded-none h-11" placeholder="Campus Gate 1" />
            </div>
            <div className="flex-1">
              <Input className="border-none shadow-none focus-visible:ring-0 rounded-none h-11" placeholder="Airport / Metro..." />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">When</label>
          <Input type="datetime-local" className="h-11 bg-background/50" />
        </div>

        <Button className="h-11 bg-primary text-primary-foreground text-base shadow-lg shadow-primary/20">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span>Popular:</span>
        <button className="hover:text-primary underline">Airport</button>
        <button className="hover:text-primary underline">City Center</button>
        <button className="hover:text-primary underline">Train Station</button>
      </div>
    </Card>
  );
}
