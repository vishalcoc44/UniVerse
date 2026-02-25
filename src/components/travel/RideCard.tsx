import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Car, ShieldCheck, Users, MapPin, Clock, IndianRupee, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface RideCardProps {
    ride: {
        id: string;
        from: string;
        to: string;
        date: string;
        seats: number;
        price: number | null;
        requestedSeats: number;
        driver: {
            id: string;
            fullName: string;
            avatarUrl: string | null;
            universityName?: string | null;
        };
    };
    isOwnRide?: boolean;
    alreadyRequested?: boolean;
    requestLoading?: boolean;
    onRequestSeat?: (rideId: string) => void;
}

export function RideCard({ ride, isOwnRide, alreadyRequested, requestLoading, onRequestSeat }: RideCardProps) {
    const seatsLeft = Math.max(ride.seats - ride.requestedSeats, 0);
    const rideDate = new Date(ride.date);
    const canRequest = !isOwnRide && !alreadyRequested && seatsLeft > 0;

    return (
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2rem] overflow-hidden group hover:border-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
            {/* Top stripe */}
            <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-violet-500/60 to-primary/60" />

            <div className="p-6 space-y-5">
                {/* Driver row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11 ring-2 ring-border/30">
                            <AvatarImage src={ride.driver.avatarUrl || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary font-black italic text-sm">{ride.driver.fullName?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-black italic tracking-tight text-sm flex items-center gap-1.5">
                                {ride.driver.fullName}
                                <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                            </p>
                            <p className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-widest">
                                {ride.driver.universityName || "Verified Student"}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={cn("text-2xl font-black italic tracking-tighter", ride.price ? "text-primary" : "text-emerald-500")}>
                            {ride.price ? `₹${ride.price}` : "Free"}
                        </p>
                        <p className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-widest">per seat</p>
                    </div>
                </div>

                {/* Route */}
                <div className="bg-background/40 rounded-2xl p-4 border border-border/30">
                    <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-1 pt-0.5">
                            <div className="h-2.5 w-2.5 rounded-full bg-foreground ring-2 ring-border" />
                            <div className="w-0.5 h-8 bg-border/60" />
                            <div className="h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-primary/30" />
                        </div>
                        <div className="flex-1 space-y-3">
                            <div>
                                <p className="text-sm font-black italic tracking-tight">{ride.from}</p>
                                <p className="text-[10px] text-muted-foreground font-bold">{format(rideDate, "h:mm a")}</p>
                            </div>
                            <div>
                                <p className="text-sm font-black italic tracking-tight text-primary">{ride.to}</p>
                                <p className="text-[10px] text-muted-foreground font-bold">{format(rideDate, "EEE, MMM d")}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Seats + status */}
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                        seatsLeft > 0 ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                        <Users className="h-3 w-3" /> {seatsLeft} seat{seatsLeft !== 1 ? "s" : ""} left
                    </span>
                    {isOwnRide && (
                        <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                            Your Ride
                        </span>
                    )}
                    {alreadyRequested && (
                        <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            Requested
                        </span>
                    )}
                </div>

                {/* Action */}
                {isOwnRide ? (
                    <Button variant="outline" className="w-full h-11 rounded-2xl font-black italic tracking-tighter text-xs border-border/40" disabled>
                        <Car className="h-4 w-4 mr-2" /> Your Offer
                    </Button>
                ) : (
                    <Button
                        className={cn(
                            "w-full h-11 rounded-2xl font-black italic tracking-tighter text-sm shadow-lg transition-all",
                            canRequest
                                ? "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                        disabled={!canRequest || requestLoading}
                        onClick={() => onRequestSeat?.(ride.id)}
                    >
                        {requestLoading ? (
                            <><span className="animate-spin mr-2">◌</span> Requesting…</>
                        ) : alreadyRequested ? (
                            "✓ Requested"
                        ) : seatsLeft === 0 ? (
                            "Ride Full"
                        ) : (
                            <><ArrowRight className="h-4 w-4 mr-2" />Request Seat</>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}
