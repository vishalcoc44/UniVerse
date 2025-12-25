import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ProfileSettings() {
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);
	const [profile, setProfile] = useState<any>({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		bio: "",
		major: "",
		linkedin: "",
		github: "",
		avatar_url: ""
	});

	useEffect(() => {
		getProfile();
	}, []);

	const getProfile = async () => {
		try {
			setLoading(true);
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;

			const { data, error } = await supabase
				.from('Profile')
				.select('*')
				.eq('id', user.id)
				.single();

			if (error) throw error;

			if (data) {
				// Split full name if possible
				const names = data.fullName ? data.fullName.split(' ') : ["", ""];
				const firstName = names[0] || "";
				const lastName = names.slice(1).join(" ") || "";

				setProfile({
					firstName,
					lastName,
					email: data.email,
					bio: data.bio || "",
					major: data.department || "",
					phone: data.phone || "",
					linkedin: data.linkedin || "",
					github: data.github || "",
					avatar_url: data.avatarUrl || ""
				});
			}
		} catch (error: any) {
			console.error('Error fetching profile:', error.message);
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		try {
			setUpdating(true);
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;

			const fullName = `${profile.firstName} ${profile.lastName}`.trim();

			const { error } = await supabase
				.from('Profile')
				.update({
					fullName,
					bio: profile.bio,
					department: profile.major, // Mapping 'major' to 'department'
					phone: profile.phone,
					linkedin: profile.linkedin,
					github: profile.github,
					updatedAt: new Date().toISOString()
				})
				.eq('id', user.id);

			if (error) throw error;
			toast.success("Profile updated successfully!");
		} catch (error: any) {
			toast.error("Error updating profile");
			console.error('Error updating profile:', error.message);
		} finally {
			setUpdating(false);
		}
	};

	const handleChange = (field: string, value: string) => {
		setProfile((prev: any) => ({ ...prev, [field]: value }));
	};

	if (loading) {
		return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
	}

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
							<AvatarImage src={profile.avatar_url} />
							<AvatarFallback className="text-lg bg-primary/10 text-primary">
								{profile.firstName?.[0]}{profile.lastName?.[0]}
							</AvatarFallback>
						</Avatar>
						<div className="space-y-2">
							<Button variant="outline" size="sm">Change Avatar</Button>
							<p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max 1MB.</p>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="firstName">First Name</Label>
							<Input
								id="firstName"
								value={profile.firstName}
								onChange={(e) => handleChange("firstName", e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="lastName">Last Name</Label>
							<Input
								id="lastName"
								value={profile.lastName}
								onChange={(e) => handleChange("lastName", e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">University Email</Label>
							<Input id="email" value={profile.email} disabled className="bg-muted/50" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="phone">Phone (Optional)</Label>
							<Input
								id="phone"
								placeholder="+1 (555) 000-0000"
								value={profile.phone}
								onChange={(e) => handleChange("phone", e.target.value)}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="bio">Bio</Label>
						<Textarea
							id="bio"
							placeholder="Tell us about yourself"
							className="resize-none min-h-[100px]"
							value={profile.bio}
							onChange={(e) => handleChange("bio", e.target.value)}
						/>
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
						<Input
							id="major"
							value={profile.major}
							onChange={(e) => handleChange("major", e.target.value)}
						/>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="linkedin">LinkedIn URL</Label>
							<Input
								id="linkedin"
								placeholder="https://linkedin.com/in/..."
								value={profile.linkedin}
								onChange={(e) => handleChange("linkedin", e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="github">GitHub / Portfolio</Label>
							<Input
								id="github"
								placeholder="https://github.com/..."
								value={profile.github}
								onChange={(e) => handleChange("github", e.target.value)}
							/>
						</div>
					</div>
					<div className="flex justify-end pt-4">
						<Button onClick={handleSave} disabled={updating}>
							{updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Save Changes
						</Button>
					</div>
				</CardContent>
			</Card>

		</div>
	);
}
