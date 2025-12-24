import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PrivacySettings() {
	return (
		<Card className="border-border/50 bg-card/50 backdrop-blur-sm">
			<CardHeader>
				<CardTitle>Privacy & Visibility</CardTitle>
				<CardDescription>Control who can see your activity across UniVerse modules.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-8">

				{/* Profile Section */}
				<div className="space-y-4">
					<h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Profile & Social</h4>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Profile Visibility</Label>
							<p className="text-xs text-muted-foreground">Who can see your full profile details</p>
						</div>
						<Select defaultValue="campus">
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Select visibility" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="public">Everyone</SelectItem>
								<SelectItem value="campus">Campus Only</SelectItem>
								<SelectItem value="connections">Connections Only</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="flex items-center justify-between space-x-2">
						<div className="space-y-0.5">
							<Label>Show Online Status</Label>
							<p className="text-xs text-muted-foreground">Let others see when you're active in Messages</p>
						</div>
						<Switch defaultChecked />
					</div>
				</div>

				{/* Career Section */}
				<div className="space-y-4">
					<h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Career Hub</h4>

					<div className="flex items-center justify-between space-x-2">
						<div className="space-y-0.5">
							<Label>Resume Visibility</Label>
							<p className="text-xs text-muted-foreground">Allow recruiters and alumni to view your resume</p>
						</div>
						<Switch defaultChecked />
					</div>
				</div>

				{/* Travel Section */}
				<div className="space-y-4">
					<h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Travel & Safety</h4>

					<div className="flex items-center justify-between space-x-2">
						<div className="space-y-0.5">
							<Label>Gender Preference Filter</Label>
							<p className="text-xs text-muted-foreground">Only show rides from same-gender drivers</p>
						</div>
						<Switch />
					</div>

					<div className="flex items-center justify-between space-x-2">
						<div className="space-y-0.5">
							<Label>Share Live Trip</Label>
							<p className="text-xs text-muted-foreground">Auto-share trip status with emergency contacts</p>
						</div>
						<Switch defaultChecked />
					</div>
				</div>

				{/* Wellness Section */}
				<div className="space-y-4">
					<h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Wellness</h4>

					<div className="flex items-center justify-between space-x-2">
						<div className="space-y-0.5">
							<Label>Private Mood Logs</Label>
							<p className="text-xs text-muted-foreground">Keep your mood entries strictly local (no cloud sync)</p>
						</div>
						<Switch defaultChecked />
					</div>
				</div>

			</CardContent>
		</Card>
	);
}
