import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { useUserSettings } from "@/hooks/useUserSettings";

export function ProfileSettings() {
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);
	const [uploadingAvatar, setUploadingAvatar] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { settings, loading: settingsLoading, updateSettings } = useUserSettings();
	const [profile, setProfile] = useState<any>({
		firstName: "",
		lastName: "",
		email: "",
		username: "",
		universityName: "",
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
				.select('*, University(name)')
				.eq('id', user.id)
				.single();

			if (error) throw error;

			if (data) {
				// Split full name if possible
				const names = data.fullName ? data.fullName.split(' ') : ["", ""];
				const firstName = names[0] || "";
				const lastName = names.slice(1).join(" ") || "";

				// Get university name from the joined University table
				const uni: any = data.University;
				const universityName = Array.isArray(uni) ? uni[0]?.name : uni?.name;

				setProfile({
					firstName,
					lastName,
					email: data.email,
					username: data.username || "",
					universityName: universityName || "",
					bio: data.bio || "",
					major: data.department || "",
					phone: settings.phone || "",
					linkedin: settings.linkedin || "",
					github: settings.github || "",
					avatar_url: data.avatarUrl || ""
				});
			}
		} catch (error: any) {
			console.error('Error fetching profile:', error.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		setProfile((prev: any) => ({
			...prev,
			phone: settings.phone || "",
			linkedin: settings.linkedin || "",
			github: settings.github || ""
		}));
	}, [settings.phone, settings.linkedin, settings.github]);

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
					updatedAt: new Date().toISOString()
				})
				.eq('id', user.id);

			if (error) throw error;

			const { error: settingsError } = await updateSettings({
				phone: profile.phone || "",
				linkedin: profile.linkedin || "",
				github: profile.github || ""
			});

			if (settingsError) throw new Error(String(settingsError));
			void import("@/lib/analytics").then(({ track }) => track("update_profile"));
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

	const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file
		if (!file.type.startsWith('image/')) {
			toast.error('Please select an image file');
			return;
		}
		if (file.size > 1024 * 1024) {
			toast.error('Image must be under 1MB');
			return;
		}

		try {
			setUploadingAvatar(true);
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;

			const fileExt = file.name.split('.').pop();
			const filePath = `${user.id}/avatar.${fileExt}`;

			// Upload to Supabase Storage
			const { error: uploadError } = await supabase.storage
				.from('avatars')
				.upload(filePath, file, { upsert: true });

			if (uploadError) throw uploadError;

			// Get public URL
			const { data: urlData } = supabase.storage
				.from('avatars')
				.getPublicUrl(filePath);

			const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

			// Update Profile
			const { error: updateError } = await supabase
				.from('Profile')
				.update({ avatarUrl, updatedAt: new Date().toISOString() })
				.eq('id', user.id);

			if (updateError) throw updateError;

			setProfile((prev: any) => ({ ...prev, avatar_url: avatarUrl }));
			void import("@/lib/analytics").then(({ track }) => track("upload_avatar"));
			toast.success('Avatar updated!');
		} catch (error: any) {
			console.error('Avatar upload error:', error);
			toast.error(error.message || 'Failed to upload avatar');
		} finally {
			setUploadingAvatar(false);
			// Reset file input so the same file can be selected again
			if (fileInputRef.current) fileInputRef.current.value = '';
		}
	};

	const handleRemoveAvatar = async () => {
		try {
			setUploadingAvatar(true);
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;

			const { error } = await supabase
				.from('Profile')
				.update({ avatarUrl: null, updatedAt: new Date().toISOString() })
				.eq('id', user.id);

			if (error) throw error;

			setProfile((prev: any) => ({ ...prev, avatar_url: '' }));
			toast.success('Avatar removed');
		} catch (error: any) {
			toast.error('Failed to remove avatar');
		} finally {
			setUploadingAvatar(false);
		}
	};

	if (loading || settingsLoading) {
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
						<div className="relative">
							<Avatar className="h-20 w-20 border-2 border-border">
								<AvatarImage src={profile.avatar_url} />
								<AvatarFallback className="text-lg bg-primary/10 text-primary">
									{profile.firstName?.[0]}{profile.lastName?.[0]}
								</AvatarFallback>
							</Avatar>
							{uploadingAvatar && (
								<div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
									<Loader2 className="h-6 w-6 animate-spin text-white" />
								</div>
							)}
						</div>
						<div className="space-y-2">
							<input
								ref={fileInputRef}
								type="file"
								accept="image/png,image/jpeg,image/gif,image/webp"
								className="hidden"
								onChange={handleAvatarUpload}
							/>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={uploadingAvatar}
									onClick={() => fileInputRef.current?.click()}
								>
									<Upload className="h-3.5 w-3.5 mr-1.5" />
									Change Avatar
								</Button>
								{profile.avatar_url && (
									<Button
										variant="ghost"
										size="sm"
										disabled={uploadingAvatar}
										onClick={handleRemoveAvatar}
										className="text-destructive hover:text-destructive"
									>
										<X className="h-3.5 w-3.5 mr-1" />
										Remove
									</Button>
								)}
							</div>
							<p className="text-xs text-muted-foreground">JPG, GIF, PNG or WebP. Max 1MB.</p>
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
							<Label htmlFor="username">Handle (@username)</Label>
							<Input id="username" value={profile.username} disabled className="bg-muted/50 font-mono text-xs" />
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
					<div className="space-y-2">
						<Label>University</Label>
						<Input value={profile.universityName || "Not assigned"} readOnly className="bg-muted/50" />
						<p className="text-xs text-muted-foreground">University is assigned from your verified email domain and cannot be changed manually.</p>
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
