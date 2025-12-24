import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Github, Linkedin, Calendar, Video } from "lucide-react";

export function IntegrationsSettings() {
	return (
		<Card className="border-border/50 bg-card/50 backdrop-blur-sm">
			<CardHeader>
				<CardTitle>Connected Accounts</CardTitle>
				<CardDescription>Supercharge UniVerse by connecting your favorite tools.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">

				{/* Core Integrations */}
				<div className="grid gap-4">
					<div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-background/50">
						<div className="flex items-center gap-4">
							<div className="p-2.5 bg-[#4285F4]/10 text-[#4285F4] rounded-lg">
								<Calendar className="h-6 w-6" />
							</div>
							<div>
								<h4 className="font-semibold text-sm">Google Calendar</h4>
								<p className="text-xs text-muted-foreground">Sync your class schedule and events.</p>
							</div>
						</div>
						<Button variant="outline" size="sm" className="gap-2">
							Connect
						</Button>
					</div>

					<div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-background/50">
						<div className="flex items-center gap-4">
							<div className="p-2.5 bg-foreground/5 text-foreground rounded-lg">
								<Github className="h-6 w-6" />
							</div>
							<div>
								<h4 className="font-semibold text-sm">GitHub</h4>
								<p className="text-xs text-muted-foreground">Display your repositories in Research Hub.</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Badge variant="secondary" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 gap-1">
								<Check className="h-3 w-3" /> Connected
							</Badge>
							<Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
								Disconnect
							</Button>
						</div>
					</div>

					<div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-background/50">
						<div className="flex items-center gap-4">
							<div className="p-2.5 bg-[#0077B5]/10 text-[#0077B5] rounded-lg">
								<Linkedin className="h-6 w-6" />
							</div>
							<div>
								<h4 className="font-semibold text-sm">LinkedIn</h4>
								<p className="text-xs text-muted-foreground">Import your work experience for Career AI.</p>
							</div>
						</div>
						<Button variant="outline" size="sm">
							Connect
						</Button>
					</div>

					<div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-background/50">
						<div className="flex items-center gap-4">
							<div className="p-2.5 bg-[#2D8CFF]/10 text-[#2D8CFF] rounded-lg">
								<Video className="h-6 w-6" />
							</div>
							<div>
								<h4 className="font-semibold text-sm">Zoom</h4>
								<p className="text-xs text-muted-foreground">Auto-generate meeting links for study groups.</p>
							</div>
						</div>
						<Button variant="outline" size="sm">
							Connect
						</Button>
					</div>
				</div>

			</CardContent>
		</Card>
	);
}
