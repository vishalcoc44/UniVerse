import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClubGrid } from "@/components/clubs/ClubGrid";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Clubs = () => {
	return (
		<DashboardLayout
			title="Clubs & Societies"
			subtitle="Explore, join, and lead student organizations."
			breadcrumb={["UniVerse", "Clubs"]}
		>
			<div className="max-w-7xl mx-auto space-y-8 pb-10">
				<Tabs defaultValue="campus" className="w-full">
					<div className="flex items-center justify-between mb-8">
						<TabsList className="grid w-[240px] grid-cols-2 bg-card/60 backdrop-blur-sm border border-border/50">
							<TabsTrigger value="campus" className="gap-2">Campus</TabsTrigger>
							<TabsTrigger value="universe" className="gap-2">Universe</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value="campus" className="mt-0 space-y-8">
						{/* Hero Section */}
						{/* Maybe only show Hero on Campus tab or change text? Keeping it simple for now */}
						<div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-8 sm:p-12 mb-8 shadow-xl">
							<div className="relative z-10 max-w-2xl">
								<h2 className="text-3xl sm:text-4xl font-bold mb-4">Find Your Tribe (Campus).</h2>
								<p className="text-lg opacity-90 mb-8 max-w-xl">
									Join one of 50+ student organizations, or start your own. Connect with like-minded peers and build something amazing together.
								</p>
								<Button variant="secondary" size="lg" className="font-semibold gap-2">
									<PlusCircle className="h-5 w-5" /> Register a New Club
								</Button>
							</div>
							<div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
								<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
									<path fill="currentColor" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-4.9C93.5,9.4,82.2,23.1,70.8,34.8C59.4,46.5,47.9,56.2,35.2,63.4C22.5,70.6,8.6,75.3,-4.5,73.1C-17.6,70.9,-30,61.8,-43.3,53.2C-56.6,44.6,-70.8,36.5,-79.1,23.6C-87.4,10.7,-89.8,-7,-84.9,-22.8C-80,-38.6,-67.8,-52.5,-54.2,-60.1C-40.6,-67.7,-25.6,-69,-11.9,-66.1C1.8,-63.2,15.5,-56.1,30.5,-83.6L44.7,-76.4Z" transform="translate(100 100)" />
								</svg>
							</div>
						</div>
						<ClubGrid scope="campus" />
					</TabsContent>

					<TabsContent value="universe" className="mt-0 space-y-8">
						<div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-8 sm:p-12 mb-8 shadow-xl">
							<div className="relative z-10 max-w-2xl">
								<h2 className="text-3xl sm:text-4xl font-bold mb-4">Explore the Universe.</h2>
								<p className="text-lg opacity-90 mb-8 max-w-xl">
									Discover cross-university organizations and global communities.
								</p>
								<Button variant="secondary" size="lg" className="font-semibold gap-2">
									<PlusCircle className="h-5 w-5" /> Start Global Initiative
								</Button>
							</div>
							<div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
								<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
									<path fill="currentColor" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-4.9C93.5,9.4,82.2,23.1,70.8,34.8C59.4,46.5,47.9,56.2,35.2,63.4C22.5,70.6,8.6,75.3,-4.5,73.1C-17.6,70.9,-30,61.8,-43.3,53.2C-56.6,44.6,-70.8,36.5,-79.1,23.6C-87.4,10.7,-89.8,-7,-84.9,-22.8C-80,-38.6,-67.8,-52.5,-54.2,-60.1C-40.6,-67.7,-25.6,-69,-11.9,-66.1C1.8,-63.2,15.5,-56.1,30.5,-83.6L44.7,-76.4Z" transform="translate(100 100)" />
								</svg>
							</div>
						</div>
						<ClubGrid scope="universe" />
					</TabsContent>
				</Tabs>
			</div>
		</DashboardLayout>
	);
};

export default Clubs;
