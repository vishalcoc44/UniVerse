import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { ClubCard } from "./ClubCard";
import { useState, useEffect } from "react";

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

import { useUserUniversity } from "@/hooks/useUserUniversity";
import { supabase } from "@/lib/supabase";

export function ClubGrid({ scope = 'campus' }: { scope?: 'campus' | 'universe' }) {
	const [searchTerm, setSearchTerm] = useState("");
	const [activeFilter, setActiveFilter] = useState("All");
	const [clubs, setClubs] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const { universityId, loading: uniLoading } = useUserUniversity();

	useEffect(() => {
		if (uniLoading) return;

		const fetchClubs = async () => {
			setLoading(true);
			let query = supabase
				.from('Club')
				.select('*')
				.eq('status', 'ACTIVE'); // Assuming status exists or just fetch all

			if (scope === 'campus') {
				if (universityId) {
					query = query.eq('scope', 'CAMPUS').eq('universityId', universityId);
				} else {
					// Not logged in or no uni, maybe show nothing or just public?
					query = query.eq('scope', 'CAMPUS'); // This might return empty if no uniId matched, or we need to handle it.
				}
			} else {
				query = query.eq('scope', 'UNIVERSE');
			}

			if (activeFilter !== "All") {
				// Schema has 'category' string? Yes.
				// We might need to map filter names to exact DB values if they differ. 
				// Schema says category is String.
				query = query.eq('category', activeFilter);
			}

			if (searchTerm) {
				query = query.ilike('name', `%${searchTerm}%`);
			}

			const { data, error } = await query;
			if (error) {
				console.error("Error fetching clubs:", error);
			} else {
				setClubs(data || []);
			}
			setLoading(false);
		};

		fetchClubs();
	}, [scope, universityId, uniLoading, activeFilter, searchTerm]);

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
				<div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
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
				</div>
			</div>

			{/* Grid */}
			{loading ? (
				<div className="text-center p-12">Loading clubs...</div>
			) : clubs.length === 0 ? (
				<div className="text-center p-12 text-muted-foreground">No clubs found in this scope.</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{clubs.map((club) => (
						<ClubCard key={club.id} {...club} />
					))}
				</div>
			)}
		</div>
	);
}
