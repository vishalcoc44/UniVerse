
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Loader2 } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { SellModal } from "./SellModal";
import type { ListingToEdit } from "./SellModal";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getListings } from "@/app/marketplace/actions";
import { toast } from "sonner";

// Defining a type that matches what ProductCard expects (or adapting ProductCard to DB)
// ProductCard expects: Product interface
// Let's check ProductCard props dynamically or just map it.

export function ProductGrid({ refreshKey, scope = "campus" }: { refreshKey?: number, scope?: "campus" | "universe" }) {
	const [products, setProducts] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState("all");
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [editingProduct, setEditingProduct] = useState<ListingToEdit | null>(null);
	const [editOpen, setEditOpen] = useState(false);

	const categories = [
		{ key: "all", label: "All" },
		{ key: "textbooks", label: "Textbooks" },
		{ key: "electronics", label: "Electronics" },
		{ key: "furniture", label: "Furniture" },
	];

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
					const category = categoryMatch ? categoryMatch[1].toLowerCase() : "other";
					const cleanDesc = item.description.replace(/^\[.*?\]\s*/, '');

					return {
						id: item.id,
						title: item.title,
						price: item.price,
						image: item.imageUrl,
						category: category,
						condition: "Good", // default
						description: cleanDesc,
						imageUrl: item.imageUrl,
						scope: item.scope,
						sellerId: item.sellerId,
						seller: {
							name: item.seller?.fullName || "Unknown",
							avatar: item.seller?.avatarUrl,
							verified: !!item.seller?.universityId
						},
						postedAt: new Date(item.createdAt).toLocaleDateString()
					};
				}) || [];
				setProducts(mapped);
				const { data: { user } } = await supabase.auth.getUser();
				if (user) setCurrentUserId(user.id);
			}

			setLoading(false);
		};

		const debounce = setTimeout(() => {
			fetchProducts();
		}, 300);
		return () => clearTimeout(debounce);
	}, [refreshKey, searchQuery, scope]);

	const filteredProducts = useMemo(() => {
		if (activeCategory === "all") return products;
		return products.filter((product) => product.category === activeCategory);
	}, [activeCategory, products]);

	const handleEditProduct = (id: string) => {
		const product = products.find(p => p.id === id);
		if (!product) return;
		setEditingProduct({
			id: product.id,
			title: product.title,
			price: product.price,
			category: product.category,
			description: product.description,
			scope: product.scope,
			imageUrl: product.imageUrl,
		});
		setEditOpen(true);
	};

	const handleDeleteProduct = async (id: string) => {
		try {
			const { error } = await supabase
				.from('MarketplaceListing')
				.delete()
				.eq('id', id);

			if (error) throw error;

			setProducts(prev => prev.filter(p => p.id !== id));
			void import("@/lib/analytics").then(({ track }) => track("delete_marketplace_listing"));
			toast.success("Listing removed successfully.");
		} catch (error: any) {
			toast.error(`Failed to delete listing: ${error.message}`);
		}
	};

	return (
		<>
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
					{categories.map((category) => (
						<Button
							key={category.key}
							variant={activeCategory === category.key ? "secondary" : "ghost"}
							className={activeCategory === category.key ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary" : undefined}
							onClick={() => setActiveCategory(category.key)}
						>
							{category.label}
						</Button>
					))}
				</div>
			</div>

			{/* Grid */}
			{loading ? (
				<div className="flex justify-center p-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
			) : filteredProducts.length === 0 ? (
				<div className="text-center p-12 text-muted-foreground">No items found. List something!</div>
			) : (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{filteredProducts.map((product) => (
						<ProductCard
							key={product.id}
							product={product}
							isSeller={currentUserId === product.sellerId}
							onDelete={handleDeleteProduct}
							onEdit={handleEditProduct}
						/>
					))}
				</div>
			)}
		</div>

		{editingProduct && (
			<SellModal
				listingToEdit={editingProduct}
				isOpen={editOpen}
				onOpenChange={(open) => {
					setEditOpen(open);
					if (!open) setEditingProduct(null);
				}}
				onListingCreated={() => window.location.reload()}
			/>
		)}
		</>
	);
}
