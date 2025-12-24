import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Car, Clock, MapPin, ShieldCheck, Users } from "lucide-react";

interface RideCardProps {
    driver: {
        name: string;
        rating: number;
        verified: boolean;
        image: string;
    };
    trip: {
        from: string;
        to: string;
        time: string;
        seats: number;
        price: number;
        date: string;
    };
    tags?: string[];
}

export function RideCard({ driver, trip, tags }: RideCardProps) {
    return (
        <Card className="hover:shadow-md transition-all duration-300 border-border/50 bg-card/60 overflow-hidden group">
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                            <AvatarImage src={driver.image} />
                            <AvatarFallback>{driver.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                                {driver.name}
                                {driver.verified && <ShieldCheck className="h-4 w-4 text-green-500" />}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="bg-yellow-500/10 text-yellow-600 px-1.5 rounded font-medium flex items-center gap-1">
                                    ★ {driver.rating}
                                </span>
                                <span>• 24 trips completed</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-xl font-bold text-foreground">₹{trip.price}</span>
                        <p className="text-xs text-muted-foreground">per seat</p>
                    </div>
                </div>

                <div className="relative pl-4 border-l-2 border-muted space-y-4 ml-2 mb-4">
                    <div className="relative">
                        <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-background bg-foreground ring-2 ring-muted" />
                        <p className="text-sm font-medium">{trip.from}</p>
                        <p className="text-xs text-muted-foreground">{trip.time}</p>
                    </div>
                    <div className="relative">
                        <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-background bg-primary ring-2 ring-muted" />
                        <p className="text-sm font-medium">{trip.to}</p>
                        <p className="text-xs text-muted-foreground">{trip.date}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="font-normal bg-muted/50 text-muted-foreground gap-1">
                        <Users className="h-3 w-3" /> {trip.seats} seats left
                    </Badge>
                    {tags?.map(tag => (
                        <Badge key={tag} variant="outline" className="font-normal text-xs">{tag}</Badge>
                    ))}
                </div>
            </div>

            <div className="bg-muted/30 p-3 flex items-center justify-between border-t border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Car className="h-4 w-4" />
                    Honda City (White)
                </div>
                <Button size="sm" className="h-8">Request Seat</Button>
            </div>
        </Card>
    );
}
