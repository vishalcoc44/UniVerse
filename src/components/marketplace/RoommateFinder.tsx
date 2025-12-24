import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Moon, Sun, Music, BookOpen, Cigarette, CigaretteOff } from "lucide-react";

interface RoommateProfile {
	id: string;
	name: string;
	major: string;
	year: string;
	avatar: string;
	budget: string;
	habits: {
		sleep: "Early Bird" | "Night Owl";
		cleanliness: "Neat Freak" | "Average" | "Relaxed";
		smoking: boolean;
		pets: boolean;
	};
	bio: string;
}

const mockProfiles: RoommateProfile[] = [
	{
		id: "1",
		name: "Jordan Lee",
		major: "Architecture",
		year: "Junior",
		avatar: "https://i.pravatar.cc/150?u=jl",
		budget: "$800 - $1000",
		habits: { sleep: "Night Owl", cleanliness: "Neat Freak", smoking: false, pets: false },
		bio: "Architecture student usually up late working on models. Looking for a quiet place near the design studio. I keep common areas very clean."
	},
	{
		id: "2",
		name: "Casey Smith",
		major: "Psychology",
		year: "Sophomore",
		avatar: "https://i.pravatar.cc/150?u=cs",
		budget: "$600 - $800",
		habits: { sleep: "Early Bird", cleanliness: "Average", smoking: false, pets: true },
		bio: "Chill person, I have a hamster named Gnocchi. Love cooking and hiking on weekends. Looking for friendly roommates."
	},
	{
		id: "3",
		name: "Alex Rivera",
		major: "Computer Science",
		year: "Senior",
		avatar: "https://i.pravatar.cc/150?u=ar",
		budget: "$900 - $1200",
		habits: { sleep: "Night Owl", cleanliness: "Average", smoking: false, pets: false },
		bio: "Gamer and coder. I'm quiet and respectful. Mostly in my room or at the library."
	}
];

export function RoommateFinder() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2 bg-primary/5 p-6 rounded-xl border border-primary/10 text-center">
				<h3 className="font-semibold text-lg">Find Your Perfect Match</h3>
				<p className="text-sm text-muted-foreground max-w-lg mx-auto">Create a profile with your living habits and budget to match with compatible roommates.</p>
				<Button className="w-fit mx-auto mt-2">Create Roommate Profile</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{mockProfiles.map(profile => (
					<Card key={profile.id} className="p-6 space-y-6 bg-card/60 backdrop-blur-sm border-border/50">
						<div className="flex items-start justify-between">
							<div className="flex items-center gap-3">
								<Avatar className="h-12 w-12 border-2 border-border">
									<AvatarImage src={profile.avatar} />
									<AvatarFallback>{profile.name[0]}</AvatarFallback>
								</Avatar>
								<div>
									<h3 className="font-semibold">{profile.name}</h3>
									<p className="text-xs text-muted-foreground">{profile.major} • {profile.year}</p>
								</div>
							</div>
							<Badge variant="secondary" className="font-mono text-xs">{profile.budget}</Badge>
						</div>

						{/* Habits Tags */}
						<div className="flex flex-wrap gap-2">
							<Badge variant="outline" className="gap-1 bg-background/50">
								{profile.habits.sleep === "Night Owl" ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
								{profile.habits.sleep}
							</Badge>
							<Badge variant="outline" className="gap-1 bg-background/50">
								<BookOpen className="h-3 w-3" />
								{profile.habits.cleanliness}
							</Badge>
							<Badge variant="outline" className="gap-1 bg-background/50">
								{profile.habits.smoking ? <Cigarette className="h-3 w-3" /> : <CigaretteOff className="h-3 w-3" />}
								{profile.habits.smoking ? "Smoker" : "Non-Smoker"}
							</Badge>
						</div>

						<p className="text-sm text-muted-foreground leading-relaxed">
							"{profile.bio}"
						</p>

						<Button className="w-full" variant="outline">Message</Button>
					</Card>
				))}
			</div>
		</div>
	);
}
