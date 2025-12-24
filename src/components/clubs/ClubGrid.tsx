import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { ClubCard } from "./ClubCard";
import { useState } from "react";

const mockClubs = [
	{
		id: "1",
		name: "UniVerse Tech Club",
		description: "The official coding and technology community. We build apps, host hackathons, and learn together.",
		category: "Tech" as const,
		members: 450,
		nextEvent: "HackNight v2 (Jan 24)",
		logo: "💻",
		isJoined: true
	},
	{
		id: "2",
		name: "Debating Society",
		description: "Fostering critical thinking and eloquence. Join us for weekly debates on current global issues.",
		category: "Academic" as const,
		members: 120,
		nextEvent: "Championship Finals (Feb 2)",
		logo: "🎙️",
		isJoined: false
	},
	{
		id: "3",
		name: "Shutterbugs Photography",
		description: "Capturing moments, one frame at a time. Workshops, photowalks, and exhibitions.",
		category: "Arts" as const,
		members: 85,
		logo: "📸",
		isJoined: false
	},
	{
		id: "4",
		name: "Campus Green Initiative",
		description: "Promoting sustainability and eco-friendly practices on campus.",
		category: "Social" as const,
		members: 200,
		nextEvent: "Tree Plantation (Jan 20)",
		logo: "🌱",
		isJoined: true
	},
	{
		id: "5",
		name: "Varsity Football Team",
		description: "Representing the university in inter-collegiate leagues.",
		category: "Sports" as const,
		members: 35,
		nextEvent: "Match vs. IT (Tomorrow)",
		logo: "⚽",
		isJoined: false
	},
];

export function ClubGrid() {
	const [searchTerm, setSearchTerm] = useState("");
	const [activeFilter, setActiveFilter] = useState("All");

	const filteredClubs = mockClubs.filter(club => {
		const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesFilter = activeFilter === "All" || club.category === activeFilter;
		return matchesSearch && matchesFilter;
	});

	return (
		<div className="space-y-6">
			{/* Search & Filter Bar */}
			<div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
				<div className="relative w-full sm:max-w-md">
					<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search for clubs..."
						className="pl-9 bg-card/50 border-border/50"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
				<div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
					{["All", "Tech", "Arts", "Sports", "Social", "Academic"].map((filter) => (
						<Button
							key={filter}
							variant={activeFilter === filter ? "default" : "outline"}
							size="sm"
							onClick={() => setActiveFilter(filter)}
							className="rounded-full"
						>
							{filter}
						</Button>
					))}
					<Button variant="ghost" size="icon" className="shrink-0">
						<Filter className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{filteredClubs.map((club) => (
					<ClubCard key={club.id} {...club} />
				))}
			</div>
		</div>
	);
}
