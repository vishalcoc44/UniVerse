'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectCard } from "@/components/research/ProjectCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Mock data for the page (since we only have ProjectCard)
const projects = [
	{
		id: "1",
		title: "Autonomous Drone Swarm Navigation",
		description: "Developing decentralized algorithms for collision avoidance in high-density drone swarms using reinforcement learning.",
		department: "Robotics",
		status: "OPEN",
		lead: { fullName: "Dr. Emily Chen", avatarUrl: "", department: "Robotics" },
		tags: ["AI", "Drones", "Python"],
		type: "Research" as const
	},
	{
		id: "2",
		title: "Sustainable Urban Vertical Farming",
		description: "Optimizing hydroponic systems for maximum yield in limited urban spaces using IoT sensors.",
		department: "Environmental Science",
		status: "Active",
		lead: { fullName: "Prof. Mark Davis", avatarUrl: "", department: "Environmental Science" },
		tags: ["IoT", "Sustainability", "Agriculture"],
		type: "Project" as const
	}
];

export default function ResearchPage() {
	return (
		<DashboardLayout
			title="Research Hub"
			subtitle="Collaborate on cutting-edge academic projects."
			breadcrumb={["UniVerse", "Research"]}
		>
			<div className="max-w-6xl mx-auto pb-10">
				<div className="flex justify-end mb-6">
					<Button>
						<Plus className="mr-2 h-4 w-4" /> New Project
					</Button>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{projects.map(p => (
						<ProjectCard key={p.id} project={p} />
					))}
				</div>
			</div>
		</DashboardLayout>
	);
}
