import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReleaseTimeline } from "@/components/updates/ReleaseTimeline";
import { FeedbackWidget } from "@/components/updates/FeedbackWidget";
import { Badge } from "@/components/ui/badge";

const Updates = () => {
	return (
		<DashboardLayout
			title="What's New"
			subtitle="Platform roadmap and changelog."
			breadcrumb={["UniVerse", "Updates"]}
		>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
				{/* Main Content: Roadmap/Changelog */}
				<div className="lg:col-span-2 space-y-8">
					<div>
						<h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
							Latest Releases
							<Badge variant="secondary" className="text-xs font-normal">Stable Channel</Badge>
						</h2>
						<ReleaseTimeline />
					</div>
				</div>

				{/* Sidebar: Feedback */}
				<div className="space-y-6">
					<FeedbackWidget />
				</div>
			</div>
		</DashboardLayout>
	);
};

export default Updates;
