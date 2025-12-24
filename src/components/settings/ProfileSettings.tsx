import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ProfileSettings() {
	return (
		<div className="space-y-6">
			<Card className="border-border/50 bg-card/50 backdrop-blur-sm">
				<CardHeader>
					<CardTitle>Personal Information</CardTitle>
					<CardDescription>Update your photo and personal details.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex items-center gap-6">
						<Avatar className="h-20 w-20 border-2 border-border">
							<AvatarImage src="" />
							<AvatarFallback className="text-lg bg-primary/10 text-primary">AS</AvatarFallback>
						</Avatar>
						<div className="space-y-2">
							<Button variant="outline" size="sm">Change Avatar</Button>
							<p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max 1MB.</p>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="firstName">First Name</Label>
							<Input id="firstName" defaultValue="Alex" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="lastName">Last Name</Label>
							<Input id="lastName" defaultValue="Student" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">University Email</Label>
							<Input id="email" defaultValue="alex.student@dsu.edu" disabled className="bg-muted/50" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="phone">Phone (Optional)</Label>
							<Input id="phone" placeholder="+1 (555) 000-0000" />
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="bio">Bio</Label>
						<Textarea id="bio" placeholder="Tell us about yourself" className="resize-none min-h-[100px]" defaultValue="CS Junior interested in AI and Web Development." />
					</div>
				</CardContent>
			</Card>

			<Card className="border-border/50 bg-card/50 backdrop-blur-sm">
				<CardHeader>
					<CardTitle>Academic & Career Links</CardTitle>
					<CardDescription>Visible to recruiters and in the Research Hub.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="major">Major / Department</Label>
						<Input id="major" defaultValue="Computer Science" />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="linkedin">LinkedIn URL</Label>
							<Input id="linkedin" placeholder="https://linkedin.com/in/..." />
						</div>
						<div className="space-y-2">
							<Label htmlFor="github">GitHub / Portfolio</Label>
							<Input id="github" placeholder="https://github.com/..." />
						</div>
					</div>
					<div className="flex justify-end pt-4">
						<Button>Save Changes</Button>
					</div>
				</CardContent>
			</Card>

		</div>
	);
}
