'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReleaseTimeline } from "@/components/updates/ReleaseTimeline";
import { FeedbackWidget } from "@/components/updates/FeedbackWidget";
import { Rocket } from "lucide-react";

export default function UpdatesPage() {
	return (
		<DashboardLayout
			title={
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
						<Rocket className="h-6 w-6" />
					</div>
					<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
						What's <span className="text-primary">New</span>
					</h1>
				</div>
			}
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
