import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface NewsItem {
	id: string;
	title: string;
	excerpt: string;
	category: string;
	image: string;
	author: {
		name: string;
		avatar: string;
	};
	date: string;
	readTime: string;
}

interface NewsCardProps {
	news: NewsItem;
}

export function NewsCard({ news }: NewsCardProps) {
	return (
		<Card className="group overflow-hidden bg-card/60 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300 flex flex-col h-full">
			<div className="relative h-48 overflow-hidden">
				<div className="absolute top-3 left-3 z-10">
					<Badge className="bg-background/80 backdrop-blur-md text-foreground hover:bg-background/90 font-medium">
						{news.category}
					</Badge>
				</div>
				<img
					src={news.image}
					alt={news.title}
					className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
				/>
			</div>

			<div className="p-5 flex-1 flex flex-col">
				<div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
					<span className="flex items-center gap-1">
						<Clock className="h-3 w-3" />
						{news.readTime}
					</span>
					<span>•</span>
					<span>{news.date}</span>
				</div>

				<h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
					{news.title}
				</h3>
				<p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
					{news.excerpt}
				</p>

				<div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
					<div className="flex items-center gap-2">
						<Avatar className="h-6 w-6">
							<AvatarImage src={news.author.avatar} />
							<AvatarFallback>{news.author.name[0]}</AvatarFallback>
						</Avatar>
						<span className="text-xs font-medium text-muted-foreground">
							{news.author.name}
						</span>
					</div>
					<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
						<Share2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</Card>
	);
}
