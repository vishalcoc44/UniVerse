
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RideFinder } from "@/components/travel/RideFinder";
import { RideCard } from "@/components/travel/RideCard";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const Travel = () => {
    const [rides, setRides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRides = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('RideOffer')
                .select(`
                    *,
                    driver:Profile(fullName, avatarUrl)
                `)
                .order('date', { ascending: true });

            if (data) {
                const mappedRides = data.map(ride => ({
                    driver: {
                        name: ride.driver?.fullName || "Unknown Driver",
                        rating: 4.8, // Mock rating
                        verified: true,
                        image: ride.driver?.avatarUrl || "https://github.com/shadcn.png"
                    },
                    trip: {
                        from: ride.from,
                        to: ride.to,
                        time: new Date(ride.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        date: new Date(ride.date).toLocaleDateString(),
                        seats: ride.seats,
                        price: ride.price
                    },
                    tags: ["Verified Student"] // Mock tags
                }));
                setRides(mappedRides);
            }
            setLoading(false);
        };
        fetchRides();
    }, []);

    return (
        <DashboardLayout
            title="Cab Pooling"
            subtitle="Save money and travel safely with peers."
            breadcrumb={["UniVerse", "Travel"]}
        >
            <div className="space-y-8 max-w-5xl mx-auto">
                <RideFinder />

                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            Available Rides
                            <Badge variant="secondary" className="bg-green-500/10 text-green-600 font-normal border-green-200">
                                <ShieldCheck className="h-3 w-3 mr-1" /> Campus Verified
                            </Badge>
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : rides.length === 0 ? (
                        <div className="text-center p-12 text-muted-foreground bg-card/30 rounded-xl border border-border/50">
                            No active ride offers. Be the first to offer a ride!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {rides.map((ride, i) => (
                                <RideCard key={i} {...ride} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Travel;
