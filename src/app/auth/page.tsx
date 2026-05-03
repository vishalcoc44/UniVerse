'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { Loader2, LogIn } from "lucide-react";

export default function Login() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const { error: authError } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (authError) throw authError;

			track("login");
			router.push("/feed"); // Redirect to Feed on success
		} catch (err: any) {
			setError(err.message || "Failed to sign in");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
			<div className="w-full max-w-md bg-card p-8 rounded-xl shadow-lg border border-border">
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
						<LogIn className="h-6 w-6 text-primary" />
					</div>
					<h1 className="text-3xl font-bold mb-2 text-foreground">Welcome Back</h1>
					<p className="text-muted-foreground">Sign in to continue your journey.</p>
				</div>

				{error && (
					<Alert variant="destructive" className="mb-6">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<form onSubmit={handleLogin} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="student@university.edu"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="password">Password</Label>
							<Link href="/forgot-password" className="text-xs text-primary hover:underline">
								Forgot password?
							</Link>
						</div>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>

					<Button type="submit" className="w-full" disabled={loading}>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Sign In
					</Button>
				</form>

				<div className="mt-6 text-center text-sm text-muted-foreground">
					Don't have an account?{" "}
					<Link href="/signup" className="text-primary hover:underline font-medium">
						Sign up
					</Link>
				</div>
			</div>
		</div>
	);
}
