
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Loader2 } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getListings } from "@/app/marketplace/actions";

// Defining a type that matches what ProductCard expects (or adapting ProductCard to DB)
// ProductCard expects: Product interface
// Let's check ProductCard props dynamically or just map it.

export function ProductGrid({ refreshKey, scope = "campus" }: { refreshKey?: number, scope?: "campus" | "universe" }) {
	const [products, setProducts] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		const fetchProducts = async () => {
			setLoading(true);

			const { success, data, error } = await getListings({
				scope,
				search: searchQuery,
				types: ['SELL']
			});

			if (!success || error) {
				console.error("Error fetching listings:", error);
			} else {
				// Map DB data to UI props
				const mapped = data?.map((item: any) => {
					// Extract category from description if present [Category] ...
					const categoryMatch = item.description.match(/^\[(.*?)\]/);
					const category = categoryMatch ? categoryMatch[1] : "General";
					const cleanDesc = item.description.replace(/^\[.*?\]\s*/, '');

					return {
						id: item.id,
						title: item.title,
						price: item.price,
						image: item.imageUrl || "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=60",
						category: category,
						condition: "Good", // default
						description: cleanDesc,
						seller: {
							name: item.seller?.fullName || "Unknown",
							avatar: item.seller?.avatarUrl,
							verified: !!item.seller?.universityId
						},
						postedAt: new Date(item.createdAt).toLocaleDateString()
					};
				}) || [];
				setProducts(mapped);
			}
			setLoading(false);
		};

		const debounce = setTimeout(() => {
			fetchProducts();
		}, 300);
		return () => clearTimeout(debounce);
	}, [refreshKey, searchQuery, scope]);

	return (
		<div className="space-y-6">
			{/* Search & Filter Bar */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search for items..."
						className="pl-9 bg-card/50"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
					<Button variant="outline" className="gap-2 bg-card/50">
						<Filter className="h-4 w-4" /> Filters
					</Button>
					<Button variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary">All</Button>
					<Button variant="ghost">Textbooks</Button>
					<Button variant="ghost">Electronics</Button>
					<Button variant="ghost">Furniture</Button>
				</div>
			</div>

			{/* Grid */}
			{loading ? (
				<div className="flex justify-center p-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
			) : products.length === 0 ? (
				<div className="text-center p-12 text-muted-foreground">No items found. List something!</div>
			) : (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{products.map((product) => (
						<ProductCard key={product.id} product={product} />
					))}
				</div>
			)}
		</div>
	);
}
