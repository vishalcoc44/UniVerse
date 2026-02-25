'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import { RoommateFinder } from "@/components/marketplace/RoommateFinder";
import { SellModal } from "@/components/marketplace/SellModal";
import { useState } from "react";
import { LostFound } from "@/components/marketplace/LostFound";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Home, HelpCircle, School, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MarketplacePage() {
	const [refreshKey, setRefreshKey] = useState(0);
	const [activeScope, setActiveScope] = useState<'campus' | 'universe'>('campus');

	const handleListingCreated = () => {
		setRefreshKey(prev => prev + 1);
	};

	return (
		<DashboardLayout
			title={
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
							<ShoppingBag className="h-6 w-6" />
						</div>
						<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
							Market<span className="text-primary">place</span>
						</h1>
					</div>
					<div className="flex items-center gap-2 mt-2">
						<div className="flex items-center p-1 bg-muted/50 rounded-lg border border-border/50">
							<button
								onClick={() => setActiveScope('campus')}
								className={cn(
									"flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
									activeScope === 'campus'
										? "bg-background text-primary shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								<School className="h-3.5 w-3.5" />
								Campus
							</button>
							<button
								onClick={() => setActiveScope('universe')}
								className={cn(
									"flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
									activeScope === 'universe'
										? "bg-background text-primary shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								<Globe className="h-3.5 w-3.5" />
								Universe
							</button>
						</div>
					</div>
				</div>
			}
			subtitle="Buy, sell, and connect across your campus and beyond."
			breadcrumb={["UniVerse", "Marketplace"]}
			action={<SellModal onListingCreated={handleListingCreated} activeScope={activeScope} />}
		>
			<div className="pb-10 h-full">
				<Tabs defaultValue="buy-sell" className="space-y-6">
					<TabsList>
						<TabsTrigger value="buy-sell" className="gap-2"><ShoppingBag className="h-4 w-4" /> Buy & Sell</TabsTrigger>
						<TabsTrigger value="housing" className="gap-2"><Home className="h-4 w-4" /> Housing</TabsTrigger>
						<TabsTrigger value="lost-found" className="gap-2"><HelpCircle className="h-4 w-4" /> Lost & Found</TabsTrigger>
					</TabsList>

					<TabsContent value="buy-sell">
						<ProductGrid refreshKey={refreshKey} scope={activeScope} />
					</TabsContent>

					<TabsContent value="housing">
						<RoommateFinder scope={activeScope} />
					</TabsContent>

					<TabsContent value="lost-found">
						<LostFound scope={activeScope} />
					</TabsContent>
				</Tabs>
			</div>
		</DashboardLayout>
	);
}
