'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RideFinder } from "@/components/travel/RideFinder";
import { Car } from "lucide-react";

export default function TravelPage() {
	return (
		<DashboardLayout
			title={
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
						<Car className="h-6 w-6" />
					</div>
					<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
						Cab <span className="text-primary">Pooling</span>
					</h1>
				</div>
			}
			subtitle="Find students to share rides with."
			breadcrumb={["UniVerse", "Travel"]}
		>
			<div className="max-w-7xl mx-auto pb-20 w-full overflow-x-hidden">
				<RideFinder />
			</div>
		</DashboardLayout>
	);
}
