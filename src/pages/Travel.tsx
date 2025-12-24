import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RideFinder } from "@/components/travel/RideFinder";
import { RideCard } from "@/components/travel/RideCard";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

const Travel = () => {
    const rides = [
        {
            driver: { name: "Rahul S.", rating: 4.8, verified: true, image: "https://i.pravatar.cc/150?u=rahul" },
            trip: { from: "Campus Gate 1", to: "International Airport", time: "5:00 PM", date: "Today", seats: 2, price: 150 },
            tags: ["Girls Only", "Large Boot"]
        },
        {
            driver: { name: "Priya M.", rating: 4.9, verified: true, image: "https://i.pravatar.cc/150?u=priya" },
            trip: { from: "Campus Hostel", to: "City Center Mall", time: "6:30 PM", date: "Tomorrow", seats: 3, price: 50 },
            tags: ["Music", "AC"]
        },
        {
            driver: { name: "Amit K.", rating: 4.5, verified: true, image: "https://i.pravatar.cc/150?u=amit" },
            trip: { from: "Tech Park", to: "Railway Station", time: "8:00 AM", date: "Jan 15", seats: 1, price: 80 },
            tags: ["Quiet"]
        }
    ];

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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rides.map((ride, i) => (
                            <RideCard key={i} {...ride} />
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Travel;
