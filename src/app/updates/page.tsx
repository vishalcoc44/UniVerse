'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReleaseTimeline } from "@/components/updates/ReleaseTimeline";
import { FeedbackWidget } from "@/components/updates/FeedbackWidget";

export default function UpdatesPage() {
	return (
		<DashboardLayout
			title="What's New"
			subtitle="Latest features and improvements to UniVerse."
			breadcrumb={["UniVerse", "Updates"]}
		>
			<div className="max-w-4xl mx-auto pb-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2">
					<ReleaseTimeline />
				</div>
				<div>
					<div className="sticky top-24">
						<FeedbackWidget />
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
