import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Calendar, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LostItem {
	id: string;
	title: string;
	type: "Lost" | "Found";
	location: string;
	date: string;
	image: string;
	description: string;
	user: string;
}

const mockItems: LostItem[] = [
	{
		id: "1",
		title: "Apple Airpods Pro (Left Ear)",
		type: "Lost",
		location: "Library 2nd Floor",
		date: "Today, 10:30 AM",
		image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?q=80&w=2000&auto=format&fit=crop",
		description: "Lost my left airpod near the quiet study zone. Case has a blue sticker.",
		user: "Alex S."
	},
	{
		id: "2",
		title: "Blue Waterman Bottle",
		type: "Found",
		location: "Gym Locker Room",
		date: "Yesterday",
		image: "https://images.unsplash.com/photo-1602143407151-011141951f2a?q=80&w=2000&auto=format&fit=crop",
		description: "Found a blue water bottle on bench #4. Left it with the front desk.",
		user: "Gym Staff"
	},
	{
		id: "3",
		title: "Black North Face Jacket",
		type: "Lost",
		location: "Student Center",
		date: "Oct 24",
		image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=2000&auto=format&fit=crop",
		description: "Left it on a chair in the cafeteria during lunch.",
		user: "Mike R."
	}
];

export function LostFound() {
	return (
		<div className="space-y-6">
			{/* Controls */}
			<div className="flex gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input placeholder="Search lost items..." className="pl-9 bg-card/50" />
				</div>
				<Button variant="destructive" className="gap-2">
					<AlertCircle className="h-4 w-4" />
					Report Lost Item
				</Button>
			</div>

			{/* Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{mockItems.map((item) => (
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
		</div>
	);
}
