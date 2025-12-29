'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClubGrid } from "@/components/clubs/ClubGrid";

export default function ClubsPage() {
	return (
		<DashboardLayout
			title="Clubs & Societies"
			subtitle="Discover and join student organizations."
			breadcrumb={["UniVerse", "Clubs"]}
		>
			<div className="max-w-6xl mx-auto pb-10">
				<ClubGrid />
			</div>
		</DashboardLayout>
	);
}
