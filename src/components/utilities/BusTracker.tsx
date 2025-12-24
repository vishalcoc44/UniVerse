import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bus, Clock, MapPin } from "lucide-react";

interface BusRoute {
  id: string;
  name: string;
  number: string;
  status: "On Time" | "Delayed" | "Arriving";
  nextStop: string;
  eta: string;
  schedule: string[];
}

const mockRoutes: BusRoute[] = [
  {
    id: "1",
    name: "Campus Loop - North",
    number: "CL-N",
    status: "Arriving",
    nextStop: "Student Center",
    eta: "2 min",
    schedule: ["8:00 AM", "8:15 AM", "8:30 AM", "8:45 AM"],
  },
  {
    id: "2",
    name: "Dorm Shuttle - East",
    number: "DS-E",
    status: "On Time",
    nextStop: "Housing Block B",
    eta: "8 min",
    schedule: ["8:10 AM", "8:30 AM", "8:50 AM", "9:10 AM"],
  },
  {
    id: "3",
    name: "Engineering Express",
    number: "ENG-X",
    status: "Delayed",
    nextStop: "Tech Park Gate 1",
    eta: "15 min",
    schedule: ["8:05 AM", "8:35 AM", "9:05 AM", "9:35 AM"],
  },
];

export function BusTracker() {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bus className="h-5 w-5 text-primary" />
          Campus Shuttle Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {mockRoutes.map((route) => (
          <div key={route.id} className="group p-4 rounded-xl border border-border/50 bg-background/40 hover:bg-background/60 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {route.number}
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{route.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <Badge variant={route.status === "Delayed" ? "destructive" : "default"} className="h-5 px-1.5 text-[10px]">
                      {route.status}
                    </Badge>
                    <span>• ETA: {route.eta}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Next Stop:</span>
                <span className="font-medium">{route.nextStop}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Next Departures:</span>
                <div className="flex gap-1.5">
                  {route.schedule.slice(0, 3).map((time, i) => (
                    <span key={i} className="bg-secondary px-1.5 py-0.5 rounded text-[10px]">{time}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
