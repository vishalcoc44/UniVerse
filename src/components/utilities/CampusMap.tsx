import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const locations = [
  { name: "University Library", type: "Academic", coords: "top-[40%] left-[50%]" },
  { name: "Student Center", type: "Social", coords: "top-[60%] left-[45%]" },
  { name: "Tech Park", type: "Academic", coords: "top-[20%] right-[20%]" },
  { name: "Sports Complex", type: "Recreation", coords: "bottom-[20%] right-[30%]" },
  { name: "Dorm Block A", type: "Housing", coords: "top-[30%] left-[20%]" },
  { name: "Cafeteria", type: "Food", coords: "top-[55%] left-[55%]" },
];

export function CampusMap() {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" />
          Interactive Map
        </CardTitle>
        <div className="relative w-full max-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Find building..." className="pl-8 h-8 text-xs bg-background/50" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 relative min-h-[400px] p-0 overflow-hidden rounded-b-xl">
        {/* Mock Map Background */}
        <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-900 bg-[size:20px_20px] opacity-100" style={{ backgroundImage: 'radial-gradient(circle, #808080 1px, transparent 1px)' }}></div>

        {/* Roads/Paths (Decorative) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <path d="M 100 200 Q 200 300 400 250 T 700 400" stroke="currentColor" strokeWidth="4" fill="none" />
          <path d="M 300 100 Q 350 300 300 500" stroke="currentColor" strokeWidth="4" fill="none" />
        </svg>

        {locations.map((loc, i) => (
          <div key={i} className={`absolute ${loc.coords} group cursor-pointer`}>
            <div className="relative flex flex-col items-center">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/25 z-10 transition-transform group-hover:scale-110">
                <MapPin className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="relative mt-2 px-2 py-1 bg-background/90 backdrop-blur-md rounded-md border border-border/50 text-xs font-medium shadow-sm transition-all opacity-100">
                {loc.name}
                <Badge variant="outline" className="hidden group-hover:flex absolute -top-8 left-1/2 -translate-x-1/2 w-max text-[10px] h-5 px-1.5 bg-background">
                  {loc.type}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
