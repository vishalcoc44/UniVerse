'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { Loader2, KeyRound, Mail } from "lucide-react";

export default function ForgotPassword() {
	const [loading, setLoading] = useState(false);
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [sent, setSent] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const redirectTo = `${window.location.origin}/reset-password`;

			const { error: resetError } = await supabase.auth.resetPasswordForEmail(
				email,
				{ redirectTo }
			);

			if (resetError) throw resetError;

			track("password_reset_requested");
			setSent(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to send reset email");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
			<div className="w-full max-w-md bg-card p-8 rounded-xl shadow-lg border border-border">
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
						{sent ? (
							<Mail className="h-6 w-6 text-primary" />
						) : (
							<KeyRound className="h-6 w-6 text-primary" />
						)}
					</div>
					<h1 className="text-3xl font-bold mb-2 text-foreground">
						{sent ? "Check your email" : "Forgot password?"}
					</h1>
					<p className="text-muted-foreground">
						{sent
							? `If an account exists for ${email}, you'll receive a reset link shortly.`
							: "Enter your email and we'll send you a link to reset your password."}
					</p>
				</div>

				{error && (
					<Alert variant="destructive" className="mb-6">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{!sent ? (
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="student@university.edu"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								autoFocus
							/>
						</div>

						<Button type="submit" className="w-full" disabled={loading}>
							{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Send reset link
						</Button>
					</form>
				) : (
					<div className="space-y-4">
						<p className="text-sm text-muted-foreground text-center">
							The link expires in 1 hour. Don't forget to check your spam folder.
						</p>
						<Button
							variant="outline"
							className="w-full"
							onClick={() => {
								setSent(false);
								setEmail("");
							}}
						>
							Send to a different email
						</Button>
					</div>
				)}

				<div className="mt-6 text-center text-sm text-muted-foreground">
					Remembered it?{" "}
					<Link href="/auth" className="text-primary hover:underline font-medium">
						Back to sign in
					</Link>
				</div>
			</div>
		</div>
	);
}
