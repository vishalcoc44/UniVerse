import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Calendar, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { getListings, ListingType } from "@/app/marketplace/actions";
import { ReportLostFoundModal } from "./ReportLostFoundModal";

export function LostFound() {
	const [items, setItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [refreshKey, setRefreshKey] = useState(0);

	const fetchItems = async () => {
		setLoading(true);
		const { success, data, error } = await getListings({
			types: ['LOST', 'FOUND'],
			search: searchQuery,
			scope: 'campus'
		});

		if (success && data) {
			const mapped = data.map((item: any) => {
				// Parse description for Location/Date if stored there
				// Expected format: Location: ...\nDate: ...\n\nDesc
				const locMatch = item.description.match(/Location: (.*?)\n/);
				const dateMatch = item.description.match(/Date: (.*?)\n/);
				const descClean = item.description.replace(/Location: .*?\nDate: .*?\n\n/, '');

				return {
					id: item.id,
					title: item.title,
					type: item.type === 'LOST' ? 'Lost' : 'Found',
					location: locMatch ? locMatch[1] : "Unknown",
					date: dateMatch ? dateMatch[1] : new Date(item.createdAt).toLocaleDateString(),
					image: item.imageUrl || "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?q=80&w=2000&auto=format&fit=crop",
					description: descClean || item.description,
					user: item.seller?.fullName || "Anonymous",
					avatar: item.seller?.avatarUrl
				};
			});
			setItems(mapped);
		} else {
			console.error(error);
		}
		setLoading(false);
	};

	useEffect(() => {
		const debounce = setTimeout(fetchItems, 300);
		return () => clearTimeout(debounce);
	}, [searchQuery, refreshKey]);

	return (
		<div className="space-y-6">
			{/* Controls */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search lost items..."
						className="pl-9 bg-card/50"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<ReportLostFoundModal onListingCreated={() => setRefreshKey(k => k + 1)} />
			</div>

			{/* Grid */}
			{loading ? (
				<div className="flex justify-center p-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
			) : items.length === 0 ? (
				<div className="text-center p-12 text-muted-foreground">No items reported.</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{items.map((item) => (
						<Card key={item.id} className="overflow-hidden bg-card/60 backdrop-blur-sm border-border/50">
							<div className="relative h-48">
								<img src={item.image} alt={item.title} className="w-full h-full object-cover" />
								<Badge
									variant={item.type === 'Lost' ? 'destructive' : 'default'}
									className="absolute top-3 right-3"
								>
									{item.type}
								</Badge>
							</div>
							<div className="p-4 space-y-4">
								<div>
									<h3 className="font-semibold text-lg">{item.title}</h3>
									<div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
										<span className="flex items-center gap-1">
											<MapPin className="h-3 w-3" /> {item.location}
										</span>
										<span className="flex items-center gap-1">
											<Calendar className="h-3 w-3" /> {item.date}
										</span>
									</div>
								</div>
								<p className="text-sm text-muted-foreground line-clamp-2">
									{item.description}
								</p>
								<div className="flex items-center justify-between pt-2">
									<div className="flex items-center gap-2 text-xs font-medium">
										<Avatar className="h-6 w-6">
											<AvatarImage src={item.avatar} />
											<AvatarFallback>{item.user[0]}</AvatarFallback>
										</Avatar>
										{item.user}
									</div>
									<Button variant="outline" size="sm">Contact</Button>
								</div>
							</div>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
