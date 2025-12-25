import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import { SellModal } from "@/components/marketplace/SellModal";
import { LostFound } from "@/components/marketplace/LostFound";
import { RoommateFinder } from "@/components/marketplace/RoommateFinder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ShoppingBag, MapPin, Users, School, Globe } from "lucide-react";
import { useState } from "react";

const Marketplace = () => {
	const [refreshKey, setRefreshKey] = useState(0);

	return (
		<DashboardLayout
			title="Marketplace"
			subtitle="Buy, sell, and discover items on campus."
			breadcrumb={["UniVerse", "Marketplace"]}
		>
			<div className="max-w-6xl mx-auto pb-10">
				<Tabs defaultValue="campus" className="w-full mb-6" onValueChange={(val) => { /* Handle scope change if needed, but we can just use two tab contents */ }}>
					<div className="flex items-center justify-between mb-4">
						<TabsList className="grid w-[240px] grid-cols-2 bg-card/60 backdrop-blur-sm border border-border/50">
							<TabsTrigger value="campus" className="gap-2"><School className="h-4 w-4" /> Campus</TabsTrigger>
							<TabsTrigger value="universe" className="gap-2"><Globe className="h-4 w-4" /> Universe</TabsTrigger>
						</TabsList>
					</div>

					{/* CAMPUS CONTENT */}
					<TabsContent value="campus" className="space-y-6 mt-0">
						<Tabs defaultValue="buy-sell" className="space-y-6">
							<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
								<TabsList className="bg-card/50 border border-border/50">
									<TabsTrigger value="buy-sell" className="gap-2">
										<ShoppingBag className="h-4 w-4" />
										Buy & Sell
									</TabsTrigger>
									<TabsTrigger value="lost-found" className="gap-2">
										<MapPin className="h-4 w-4" />
										Lost & Found
									</TabsTrigger>
									<TabsTrigger value="roommates" className="gap-2">
										<Users className="h-4 w-4" />
										Roommate Finder
									</TabsTrigger>
								</TabsList>

								<div className="hidden md:block">
									<TabsContent value="buy-sell" className="mt-0">
										<SellModal onListingCreated={() => setRefreshKey(prev => prev + 1)} />
									</TabsContent>
								</div>
							</div>

							<TabsContent value="buy-sell" className="space-y-6 m-0 animate-in fade-in-50 duration-500">
								<div className="md:hidden w-full">
									<SellModal onListingCreated={() => setRefreshKey(prev => prev + 1)} />
								</div>
								<ProductGrid refreshKey={refreshKey} scope="campus" />
							</TabsContent>

							<TabsContent value="lost-found" className="space-y-6 m-0 animate-in fade-in-50 duration-500">
								<LostFound />
							</TabsContent>

							<TabsContent value="roommates" className="space-y-6 m-0 animate-in fade-in-50 duration-500">
								<RoommateFinder />
							</TabsContent>
						</Tabs>
					</TabsContent>

					{/* UNIVERSE CONTENT */}
					<TabsContent value="universe" className="space-y-6 mt-0">
						<Tabs defaultValue="buy-sell" className="space-y-6">
							<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
								<TabsList className="bg-card/50 border border-border/50">
									<TabsTrigger value="buy-sell" className="gap-2">
										<ShoppingBag className="h-4 w-4" />
										Buy & Sell
									</TabsTrigger>
									<TabsTrigger value="lost-found" className="gap-2">
										<MapPin className="h-4 w-4" />
										Lost & Found
									</TabsTrigger>
									<TabsTrigger value="roommates" className="gap-2">
										<Users className="h-4 w-4" />
										Roommate Finder
									</TabsTrigger>
								</TabsList>
								<div className="hidden md:block">
									<TabsContent value="buy-sell" className="mt-0">
										<SellModal onListingCreated={() => setRefreshKey(prev => prev + 1)} />
									</TabsContent>
								</div>
							</div>

							<TabsContent value="buy-sell" className="space-y-6 m-0 animate-in fade-in-50 duration-500">
								<div className="md:hidden w-full">
									<SellModal onListingCreated={() => setRefreshKey(prev => prev + 1)} />
								</div>
								<ProductGrid refreshKey={refreshKey} scope="universe" />
							</TabsContent>

							<TabsContent value="lost-found" className="space-y-6 m-0 animate-in fade-in-50 duration-500">
								<div className="text-center p-8 text-muted-foreground">Global Lost & Found coming soon.</div>
							</TabsContent>

							<TabsContent value="roommates" className="space-y-6 m-0 animate-in fade-in-50 duration-500">
								<div className="text-center p-8 text-muted-foreground">Global Roommate Finder coming soon.</div>
							</TabsContent>
						</Tabs>
					</TabsContent>
				</Tabs>
			</div>
		</DashboardLayout>
	);
};

export default Marketplace;
