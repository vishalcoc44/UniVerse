'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CampusMap } from "@/components/utilities/CampusMap";
import { BusTracker } from "@/components/utilities/BusTracker";
import { DiscountHub } from "@/components/utilities/DiscountHub";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, Bus, Tag, Search, Wrench } from "lucide-react";

export default function UtilitiesPage() {
	return (
		<DashboardLayout
			icon={Wrench}
			title={<>Campus <span className="text-primary">Utilities</span></>}
			subtitle="Tools to navigate and save around campus."
			breadcrumb={["UniVerse", "Utilities"]}
		>
			<div className="h-[calc(100vh-12rem)] min-h-[600px] flex flex-col gap-6">
				<Tabs defaultValue="map" className="h-full flex flex-col">
					<div className="flex items-center justify-between mb-4">
						<TabsList>
							<TabsTrigger value="map" className="flex items-center gap-2">
								<Map className="h-4 w-4" /> Campus Map
							</TabsTrigger>
							<TabsTrigger value="shuttle" className="flex items-center gap-2">
								<Bus className="h-4 w-4" /> Shuttle Tracker
							</TabsTrigger>
							<TabsTrigger value="discounts" className="flex items-center gap-2">
								<Tag className="h-4 w-4" /> Student Discounts
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value="map" className="flex-1 mt-0 h-full">
						<CampusMap />
					</TabsContent>

					<TabsContent value="shuttle" className="flex-1 mt-0 h-full">
						<BusTracker />
					</TabsContent>

					<TabsContent value="discounts" className="flex-1 mt-0 h-full">
						<DiscountHub />
					</TabsContent>
				</Tabs>
			</div>
		</DashboardLayout>
	);
}
