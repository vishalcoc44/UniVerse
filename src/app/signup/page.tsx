'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { Loader2, GraduationCap } from "lucide-react";

export default function Signup() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [universities, setUniversities] = useState<any[]>([]);
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		fullName: "",
		username: ""
	});
	const [error, setError] = useState<string | null>(null);
	const [matchedUni, setMatchedUni] = useState<any | null>(null);

	useEffect(() => {
		const fetchUniversities = async () => {
			const { data, error } = await supabase
				.from('University')
				.select('*')
				.eq('status', 'APPROVED');

			if (error) {
				console.error('Error fetching universities:', error);
			} else {
				setUniversities(data || []);
			}
		};

		fetchUniversities();
	}, []);

	// Check email domain against universities
	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const email = e.target.value;
		setFormData(prev => ({ ...prev, email }));


		if (email.includes('@')) {
			const domain = email.split('@')[1].toLowerCase();
			console.log('Checking domain:', domain, 'against universities:', universities);

			// Check if any university has this domain
			const match = universities.find(uni =>
				uni.domains && uni.domains.some((d: string) => d.toLowerCase() === domain)
			);
			console.log('Match found:', match);
			setMatchedUni(match || null);
		} else {
			setMatchedUni(null);
		}
	};

	const handleSignup = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			if (!matchedUni) {
				// Optional: Block signup if not a uni email?
				// For now, warn but maybe allow? Or strictly enforce?
				// User requirement: "Scalable University Verification".
				// I'll show error if no match found.
				throw new Error("Please use a valid university email address to sign up.");
			}

			const { data: authData, error: authError } = await supabase.auth.signUp({
				email: formData.email,
				password: formData.password,
				options: {
					data: {
						full_name: formData.fullName,
						username: formData.username,
						universityId: matchedUni.id
					}
				}
			});

			if (authError) throw authError;

			if (authData.user) {
				// Create or Update Profile
				// Depending on if a trigger exists, we might race. 
				// Best practice: Upsert or Update.
				// We'll try to insert/upsert the profile with universityId.

				const { error: profileError } = await supabase
					.from('Profile')
					.upsert({
						id: authData.user.id,
						email: formData.email,
						username: formData.username,
						fullName: formData.fullName,
						universityId: matchedUni.id,
						role: 'STUDENT',
						updatedAt: new Date().toISOString()
					}, { onConflict: 'id' }); // Update if exists

				if (profileError) {
					console.error("Profile creation error:", profileError);
					// Continue anyway, maybe trigger handled it? 
					// But we ideally want matchedUni.id to be set.
					// If trigger created it, it won't have matchedUni.id.
					// So we must update it if upsert failed or just update it guarantees.

					await supabase
						.from('Profile')
						.update({ universityId: matchedUni.id })
						.eq('id', authData.user.id);
				}
			}

			track("signup", { universityId: matchedUni.id });
			router.push("/feed"); // Redirect to Feed
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
			<div className="w-full max-w-md bg-card p-8 rounded-xl shadow-lg border border-border">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold mb-2 text-foreground">Join UniVerse</h1>
					<p className="text-muted-foreground">Connect with your campus community.</p>
				</div>

				{error && (
					<Alert variant="destructive" className="mb-6">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<form onSubmit={handleSignup} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">University Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="student@university.edu"
							value={formData.email}
							onChange={handleEmailChange}
							required
						/>
						{matchedUni && (
							<div className="text-xs text-green-600 flex items-center gap-1 animate-in fade-in">
								<GraduationCap className="h-3 w-3" />
								Verified: {matchedUni.name}
							</div>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="fullName">Full Name</Label>
						<Input
							id="fullName"
							placeholder="John Doe"
							value={formData.fullName}
							onChange={e => setFormData({ ...formData, fullName: e.target.value })}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="username">Username</Label>
						<Input
							id="username"
							placeholder="johndoe"
							value={formData.username}
							onChange={e => setFormData({ ...formData, username: e.target.value })}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							value={formData.password}
							onChange={e => setFormData({ ...formData, password: e.target.value })}
							required
						/>
					</div>

					<Button type="submit" className="w-full" disabled={loading}>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Create Account
					</Button>
				</form>

				<div className="mt-6 text-center text-sm text-muted-foreground">
					Already have an account?{" "}
					<Link href="/auth" className="text-primary hover:underline font-medium">
						Log in
					</Link>
				</div>
			</div>
		</div>
	);
}
