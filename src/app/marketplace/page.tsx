'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import { RoommateFinder } from "@/components/marketplace/RoommateFinder";
import { SellModal } from "@/components/marketplace/SellModal";
import { useState } from "react";
import { LostFound } from "@/components/marketplace/LostFound";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Home, HelpCircle } from "lucide-react";

export default function MarketplacePage() {
	const [refreshKey, setRefreshKey] = useState(0);

	const handleListingCreated = () => {
		setRefreshKey(prev => prev + 1);
	};

	return (
		<DashboardLayout
			title="Marketplace"
			subtitle="Buy, sell, and connect with other students."
			breadcrumb={["UniVerse", "Marketplace"]}
			action={<SellModal onListingCreated={handleListingCreated} />}
		>
			<div className="pb-10 h-full">
				<Tabs defaultValue="buy-sell" className="space-y-6">
					<TabsList>
						<TabsTrigger value="buy-sell" className="gap-2"><ShoppingBag className="h-4 w-4" /> Buy & Sell</TabsTrigger>
						<TabsTrigger value="housing" className="gap-2"><Home className="h-4 w-4" /> Housing</TabsTrigger>
						<TabsTrigger value="lost-found" className="gap-2"><HelpCircle className="h-4 w-4" /> Lost & Found</TabsTrigger>
					</TabsList>

					<TabsContent value="buy-sell">
						<ProductGrid refreshKey={refreshKey} />
					</TabsContent>

					<TabsContent value="housing">
						<RoommateFinder />
					</TabsContent>

					<TabsContent value="lost-found">
						<LostFound />
					</TabsContent>
				</Tabs>
			</div>
		</DashboardLayout>
	);
}
