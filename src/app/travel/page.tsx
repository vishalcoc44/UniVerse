'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RideFinder } from "@/components/travel/RideFinder";
import { Car } from "lucide-react";

export default function TravelPage() {
	return (
		<DashboardLayout
			icon={Car}
			title={<>Cab <span className="text-primary">Pooling</span></>}
			subtitle="Find students to share rides with."
			breadcrumb={["UniVerse", "Travel"]}
		>
			<div className="max-w-7xl mx-auto pb-20 w-full overflow-x-hidden">
				<RideFinder />
			</div>
		</DashboardLayout>
	);
}
