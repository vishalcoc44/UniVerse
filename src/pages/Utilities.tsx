import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BusTracker } from "@/components/utilities/BusTracker";
import { CampusMap } from "@/components/utilities/CampusMap";
import { DiscountHub } from "@/components/utilities/DiscountHub";

const Utilities = () => {
    return (
        <DashboardLayout
            title="Utilities"
            subtitle="Campus tools and resources."
            breadcrumb={["UniVerse", "Utilities"]}
        >
            <div className="max-w-7xl mx-auto h-[calc(100vh-10rem)] min-h-[600px] flex flex-col gap-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

                    {/* Left Column: Trackers */}
                    <div className="lg:col-span-6 flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
                        <div className="flex-shrink-0">
                            <BusTracker />
                        </div>
                        <div className="flex-grow">
                            <DiscountHub />
                        </div>
                    </div>

                    {/* Right Column: Map */}
                    <div className="lg:col-span-6 h-full min-h-[500px]">
                        <CampusMap />
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
};

export default Utilities;
