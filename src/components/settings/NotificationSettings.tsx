import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function NotificationSettings() {
	return (
		<Card className="border-border/50 bg-card/50 backdrop-blur-sm">
			<CardHeader>
				<CardTitle>Notifications</CardTitle>
				<CardDescription>Manage how you receive alerts across UniVerse.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-8">

				{/* Core Communication */}
				<div className="space-y-4">
					<h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Messages & Social</h4>
					<div className="flex items-center justify-between space-x-2">
						<Label htmlFor="dm" className="flex-1">Direct Messages</Label>
						<Switch id="dm" defaultChecked />
					</div>
					<div className="flex items-center justify-between space-x-2">
						<Label htmlFor="mentions" className="flex-1">Mentions</Label>
						<Switch id="mentions" defaultChecked />
					</div>
					<div className="flex items-center justify-between space-x-2">
						<Label htmlFor="replies" className="flex-1">Post Replies</Label>
						<Switch id="replies" defaultChecked />
					</div>
				</div>

				{/* Academic & Events */}
				<div className="space-y-4">
					<h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Academic & Events</h4>
					<div className="flex items-center justify-between space-x-2">
						<Label htmlFor="deadlines" className="flex-1">Assignment Deadlines</Label>
						<Switch id="deadlines" defaultChecked />
					</div>
					<div className="flex items-center justify-between space-x-2">
						<Label htmlFor="study-groups" className="flex-1">Study Group Invites</Label>
						<Switch id="study-groups" defaultChecked />
					</div>
					<div className="flex items-center justify-between space-x-2">
						<Label htmlFor="events" className="flex-1">Event Reminders (1 Hour Before)</Label>
						<Switch id="events" defaultChecked />
					</div>
				</div>

				{/* Career & Research */}
				<div className="space-y-4">
					<h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Career & Research</h4>
					<div className="flex items-center justify-between space-x-2">
						<Label htmlFor="job-alerts" className="flex-1">New Job Matches</Label>
						<Switch id="job-alerts" defaultChecked />
					</div>
					<div className="flex items-center justify-between space-x-2">
						<Label htmlFor="research-updates" className="flex-1">Research Project Updates</Label>
						<Switch id="research-updates" defaultChecked />
					</div>
				</div>

				{/* Travel & Wellness */}
				<div className="space-y-4">
					<h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Travel & Wellness</h4>
					<div className="flex items-center justify-between space-x-2">
						<Label htmlFor="ride-updates" className="flex-1">Ride Request Status</Label>
						<Switch id="ride-updates" defaultChecked />
					</div>
					<div className="flex items-center justify-between space-x-2">
						<Label htmlFor="mood-reminder" className="flex-1">Daily Mood Check-in</Label>
						<Switch id="mood-reminder" />
					</div>
				</div>

			</CardContent>
		</Card>
	);
}
