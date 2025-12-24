import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, GitCommit, Rocket, Wrench } from "lucide-react";

interface UpdateItem {
	id: string;
	version: string;
	date: string;
	type: "major" | "minor" | "patch";
	title: string;
	changes: string[];
}

export function ReleaseTimeline() {
	const updates: UpdateItem[] = [
		{
			id: "1",
			version: "v1.2.0",
			date: "Today",
			type: "major",
			title: "The UniVerse Expansion",
			changes: [
				"Launched Cab Pooling module for safe travel.",
				"Introduced Mental Wellness tracker and insights.",
				"Added Anonymous Forums for open discussions.",
				"Released Research Hub for faculty-student collaboration."
			]
		},
		{
			id: "2",
			version: "v1.1.0",
			date: "Oct 15, 2025",
			type: "minor",
			title: "Social Features Update",
			changes: [
				"Added 'Universe Feed' for inter-college networking.",
				"Implemented rich-text post editor.",
				"Enabled image and video attachments.",
				"Improved comment threading."
			]
		},
		{
			id: "3",
			version: "v1.0.0",
			date: "Oct 1, 2025",
			type: "major",
			title: "Initial Launch",
			changes: [
				"Core platform release.",
				"User authentication with DSU email.",
				"Basic event management system.",
				"Student directory."
			]
		}
	];

	return (
		<div className="space-y-8 relative pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border/50">
			{updates.map((update) => (
				<div key={update.id} className="relative">
					<div className="absolute -left-[37px] top-1 h-6 w-6 rounded-full border-2 border-background bg-primary shadow-sm flex items-center justify-center text-primary-foreground z-10">
						{update.type === 'major' ? <Rocket className="h-3 w-3" /> : <GitCommit className="h-3 w-3" />}
					</div>

					<div className="space-y-3">
						<div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
							<div className="flex items-center gap-2">
								<span className="font-mono text-sm font-bold text-primary">{update.version}</span>
								<Badge variant="outline" className="text-[10px] font-normal">{update.type}</Badge>
							</div>
							<span className="text-xs text-muted-foreground">{update.date}</span>
						</div>

						<Card className="p-5 border-border/50 bg-card/60 backdrop-blur-sm">
							<h3 className="font-semibold text-lg mb-4">{update.title}</h3>
							<ul className="space-y-2">
								{update.changes.map((change, idx) => (
									<li key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground/90">
										<CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
										<span>{change}</span>
									</li>
								))}
							</ul>
						</Card>
					</div>
				</div>
			))}
		</div>
	);
}
