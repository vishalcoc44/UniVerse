import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle } from "lucide-react";

export interface Product {
	id: string;
	title: string;
	price: number;
	image: string;
	category: string;
	condition: "New" | "Like New" | "Good" | "Fair";
	seller: {
		name: string;
		avatar: string;
		verified: boolean;
	};
	postedAt: string;
}

interface ProductCardProps {
	product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
	return (
		<Card className="group overflow-hidden bg-card/60 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300">
			<div className="relative aspect-square overflow-hidden bg-muted">
				<img
					src={product.image}
					alt={product.title}
					className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
				/>
				<Button
					size="icon"
					variant="secondary"
					className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background/90"
				>
					<Heart className="h-4 w-4" />
				</Button>
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
					<Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground">
						<MessageCircle className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</Card>
	);
}
