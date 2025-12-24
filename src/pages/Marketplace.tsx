import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import { SellModal } from "@/components/marketplace/SellModal";
import { LostFound } from "@/components/marketplace/LostFound";
import { RoommateFinder } from "@/components/marketplace/RoommateFinder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ShoppingBag, MapPin, Users } from "lucide-react";

const Marketplace = () => {
	return (
		<DashboardLayout
			title="Marketplace"
			subtitle="Buy, sell, and discover items on campus."
			breadcrumb={["UniVerse", "Marketplace"]}
		>
			<div className="max-w-6xl mx-auto pb-10">
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
							{/* Contextual actions could go here depending on tab */}
							<TabsContent value="buy-sell" className="mt-0">
								<SellModal />
							</TabsContent>
						</div>
					</div>

					<TabsContent value="buy-sell" className="space-y-6 m-0 animate-in fade-in-50 duration-500">
						{/* Mobile button if needed */}
						<div className="md:hidden w-full">
							<SellModal />
						</div>
						<ProductGrid />
					</TabsContent>

					<TabsContent value="lost-found" className="space-y-6 m-0 animate-in fade-in-50 duration-500">
						<LostFound />
					</TabsContent>

					<TabsContent value="roommates" className="space-y-6 m-0 animate-in fade-in-50 duration-500">
						<RoommateFinder />
					</TabsContent>
				</Tabs>
			</div>
		</DashboardLayout>
	);
};

export default Marketplace;
