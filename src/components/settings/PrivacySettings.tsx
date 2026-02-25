import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useUserSettings } from "@/hooks/useUserSettings";
import { Loader2 } from "lucide-react";

export function PrivacySettings() {
	const { settings, loading, updateSettings } = useUserSettings();

	const onUpdate = async (partial: Parameters<typeof updateSettings>[0], successMessage?: string) => {
		const { error } = await updateSettings(partial);
		if (error) {
			toast.error(String(error));
			return;
		}
		if (successMessage) {
			toast.success(successMessage);
		}
	};

	if (loading) {
		return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
	}

	return (
		<Card className="border-border/50 bg-card/50 backdrop-blur-sm">
			<CardHeader>
				<CardTitle>Privacy & Visibility</CardTitle>
				<CardDescription>Control who can see your activity across UniVerse modules.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-8">

				<div className="space-y-4">
					<h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Profile & Social</h4>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Profile Visibility</Label>
							<p className="text-xs text-muted-foreground">Who can see your full profile details</p>
						</div>
						<Select value={settings.profileVisibility} onValueChange={(value) => onUpdate({ profileVisibility: value })}>
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
						<Switch checked={settings.showOnlineStatus} onCheckedChange={(checked) => onUpdate({ showOnlineStatus: checked }, "Online status preference updated.")} />
					</div>
				</div>

				<div className="space-y-4">
					<h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Career Hub</h4>

					<div className="flex items-center justify-between space-x-2">
						<div className="space-y-0.5">
							<Label>Resume Visibility</Label>
							<p className="text-xs text-muted-foreground">Allow recruiters and alumni to view your resume</p>
						</div>
						<Switch checked={settings.resumeVisibility} onCheckedChange={(checked) => onUpdate({ resumeVisibility: checked })} />
					</div>
				</div>

				<div className="space-y-4">
					<h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Travel & Safety</h4>

					<div className="flex items-center justify-between space-x-2">
						<div className="space-y-0.5">
							<Label>Gender Preference Filter</Label>
							<p className="text-xs text-muted-foreground">Only show rides from same-gender co-riders</p>
						</div>
						<Switch checked={settings.genderFilterEnabled} onCheckedChange={(checked) => onUpdate({ genderFilterEnabled: checked })} />
					</div>

					<div className="flex items-center justify-between space-x-2">
						<div className="space-y-0.5">
							<Label>Share Live Trip</Label>
							<p className="text-xs text-muted-foreground">Auto-share trip status with emergency contacts</p>
						</div>
						<Switch checked={settings.shareLiveTrip} onCheckedChange={(checked) => onUpdate({ shareLiveTrip: checked })} />
					</div>
				</div>

				<div className="space-y-4">
					<h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Wellness</h4>

					<div className="flex items-center justify-between space-x-2">
						<div className="space-y-0.5">
							<Label>Private Mood Logs</Label>
							<p className="text-xs text-muted-foreground">Keep your mood entries strictly local (no cloud sync)</p>
						</div>
						<Switch checked={settings.privateMoodLogs} onCheckedChange={(checked) => onUpdate({ privateMoodLogs: checked })} />
					</div>
				</div>

			</CardContent>
		</Card>
	);
}
