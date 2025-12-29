'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RideFinder } from "@/components/travel/RideFinder";

export default function TravelPage() {
	return (
		<DashboardLayout
			title="Cab Pooling"
			subtitle="Find students to share rides with."
			breadcrumb={["UniVerse", "Travel"]}
		>
			<div className="max-w-4xl mx-auto pb-10">
				<RideFinder />
			</div>
		</DashboardLayout>
	);
}
