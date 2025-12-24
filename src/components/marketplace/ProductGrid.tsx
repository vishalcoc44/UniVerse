import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { ProductCard, Product } from "./ProductCard";

const mockProducts: Product[] = [
	{
		id: "1",
		title: "Calculus: Early Transcendentals (8th Ed)",
		price: 45,
		image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=2000&auto=format&fit=crop",
		category: "Textbooks",
		condition: "Good",
		seller: { name: "David Kim", avatar: "https://i.pravatar.cc/150?u=d", verified: true },
		postedAt: "2h ago"
	},
	{
		id: "2",
		title: "IKEA Desk Lamp - Black",
		price: 15,
		image: "https://images.unsplash.com/photo-1534073828943-f801091a7d58?q=80&w=2000&auto=format&fit=crop",
		category: "Furniture",
		condition: "Like New",
		seller: { name: "Sarah Jenkins", avatar: "https://i.pravatar.cc/150?u=s", verified: true },
		postedAt: "5h ago"
	},
	{
		id: "3",
		title: "Graphing Calculator TI-84 Plus",
		price: 80,
		image: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=2000&auto=format&fit=crop",
		category: "Electronics",
		condition: "Good",
		seller: { name: "Mike Chen", avatar: "https://i.pravatar.cc/150?u=m", verified: true },
		postedAt: "1d ago"
	},
	{
		id: "4",
		title: "Introduction to Algorithms",
		price: 55,
		image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=2000&auto=format&fit=crop",
		category: "Textbooks",
		condition: "New",
		seller: { name: "Emma Wilson", avatar: "https://i.pravatar.cc/150?u=e", verified: true },
		postedAt: "1d ago"
	},
	{
		id: "5",
		title: "Mini Fridge",
		price: 60,
		image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?q=80&w=2000&auto=format&fit=crop",
		category: "Electronics",
		condition: "Fair",
		seller: { name: "Jake Paul", avatar: "https://i.pravatar.cc/150?u=j", verified: false },
		postedAt: "2d ago"
	},
	{
		id: "6",
		title: "Lab Coat (Size M)",
		price: 10,
		image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2000&auto=format&fit=crop",
		category: "Clothing",
		condition: "Like New",
		seller: { name: "Amy Li", avatar: "https://i.pravatar.cc/150?u=a", verified: true },
		postedAt: "3d ago"
	}
];

export function ProductGrid() {
	return (
		<div className="space-y-6">
			{/* Search & Filter Bar */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input placeholder="Search for books, furniture, electronics..." className="pl-9 bg-card/50" />
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
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{mockProducts.map((product) => (
					<ProductCard key={product.id} product={product} />
				))}
			</div>
		</div>
	);
}
