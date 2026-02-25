import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Trash2, Pencil, Send, Package } from "lucide-react";
import Link from "next/link";

export interface Product {
	id: string;
	title: string;
	price: number;
	image: string;
	category: string;
	condition: "New" | "Like New" | "Good" | "Fair";
	sellerId?: string;
	seller: {
		name: string;
		avatar: string;
		verified: boolean;
	};
	postedAt: string;
}

interface ProductCardProps {
	product: Product;
	isSeller?: boolean;
	onDelete?: (id: string) => void;
	onEdit?: (id: string) => void;
}

export function ProductCard({ product, isSeller = false, onDelete, onEdit }: ProductCardProps) {
	return (
		<Card className="group overflow-hidden bg-card/60 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300">
			<div className="relative aspect-square overflow-hidden bg-muted">
				{product.image ? (
					<img
						src={product.image}
						alt={product.title}
						className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
					/>
				) : (
					<div className="w-full h-full flex flex-col items-center justify-center bg-muted/50 transition-colors group-hover:bg-muted/70">
						<Package className="h-12 w-12 text-muted-foreground/40" />
						<span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mt-2">No Image</span>
					</div>
				)}
				<div className="absolute top-2 right-2 flex gap-1.5">
					{isSeller && onEdit && (
						<Button
							size="icon"
							variant="secondary"
							onClick={() => onEdit(product.id)}
							className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background/90"
						>
							<Pencil className="h-3.5 w-3.5" />
						</Button>
					)}
					{isSeller && onDelete && (
						<Button
							size="icon"
							variant="secondary"
							onClick={() => onDelete(product.id)}
							className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 hover:bg-red-600/90 text-white"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}
					<Button
						size="icon"
						variant="secondary"
						className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background/90"
					>
						<Heart className="h-4 w-4" />
					</Button>
				</div>
				<Badge className="absolute bottom-2 left-2 bg-black/70 hover:bg-black/80 backdrop-blur-sm text-white border-0">
					${product.price}
				</Badge>
			</div>

			<div className="p-4 space-y-3">
				<div>
					<div className="flex items-start justify-between gap-2">
						<h3 className="font-semibold truncate group-hover:text-primary transition-colors">
							{product.title}
						</h3>
					</div>
					<div className="flex items-center gap-2 mt-1">
						<Badge variant="outline" className="text-[10px] h-5 px-1.5">{product.condition}</Badge>
						<span className="text-xs text-muted-foreground">{product.postedAt}</span>
					</div>
				</div>

				<div className="flex items-center justify-between pt-2 border-t border-border/50">
					<div className="flex items-center gap-2">
						<Avatar className="h-6 w-6">
							<AvatarImage src={product.seller.avatar} />
							<AvatarFallback>{product.seller.name[0]}</AvatarFallback>
						</Avatar>
						<div className="flex flex-col">
							<span className="text-xs font-medium leading-none">{product.seller.name}</span>
							{product.seller.verified && (
								<span className="text-[10px] text-blue-500 flex items-center gap-0.5">Verified Student</span>
							)}
						</div>
					</div>
					<Link href={`/messages?userId=${product.sellerId || ''}`}>
						<Button variant="outline" size="sm" className="h-8 text-[11px] gap-1.5 border-primary/20 hover:bg-primary/5 text-primary">
							<Send className="h-3 w-3" /> Contact
						</Button>
					</Link>
				</div>
			</div>
		</Card>
	);
}
