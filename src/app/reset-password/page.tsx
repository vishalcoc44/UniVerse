'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { Loader2, KeyRound, CheckCircle2 } from "lucide-react";

type Status = "verifying" | "ready" | "invalid" | "saving" | "done";

export default function ResetPassword() {
	const router = useRouter();
	const [status, setStatus] = useState<Status>("verifying");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		const verify = async () => {
			// The email link redirects here. @supabase/ssr's createBrowserClient
			// auto-detects the `?code=...` query param (PKCE) and exchanges it for
			// a session, firing onAuthStateChange. Older implicit-flow links land
			// with a `#access_token=...` fragment, which the client also handles.
			// We listen for PASSWORD_RECOVERY first, then fall back to checking
			// for an existing session (covers reloads and already-exchanged codes).
			const { data: sub } = supabase.auth.onAuthStateChange((event) => {
				if (cancelled) return;
				if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
					setStatus("ready");
				}
			});

			// Fallback: if the code was already exchanged before the listener
			// attached, getSession will still return the recovery session.
			const { data, error: sessionError } = await supabase.auth.getSession();
			if (cancelled) return;

			if (sessionError) {
				setError(sessionError.message);
				setStatus("invalid");
				return;
			}

			// Give the URL handler a brief moment to process ?code=... on first paint.
			setTimeout(async () => {
				if (cancelled) return;
				const { data: latest } = await supabase.auth.getSession();
				if (cancelled) return;
				if (latest.session) {
					setStatus("ready");
				} else if (!data.session) {
					setStatus("invalid");
				}
			}, 800);

			return () => {
				sub.subscription.unsubscribe();
			};
		};

		verify();
		return () => {
			cancelled = true;
		};
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (password.length < 8) {
			setError("Password must be at least 8 characters.");
			return;
		}
		if (password !== confirm) {
			setError("Passwords do not match.");
			return;
		}

		setStatus("saving");
		try {
			const { error: updateError } = await supabase.auth.updateUser({ password });
			if (updateError) throw updateError;

			track("password_reset_completed");
			setStatus("done");
			setTimeout(() => router.push("/feed"), 1500);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update password");
			setStatus("ready");
		}
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
			<div className="w-full max-w-md bg-card p-8 rounded-xl shadow-lg border border-border">
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
						{status === "done" ? (
							<CheckCircle2 className="h-6 w-6 text-primary" />
						) : (
							<KeyRound className="h-6 w-6 text-primary" />
						)}
					</div>
					<h1 className="text-3xl font-bold mb-2 text-foreground">
						{status === "done" ? "Password updated" : "Set a new password"}
					</h1>
					<p className="text-muted-foreground">
						{status === "verifying" && "Verifying your reset link…"}
						{status === "invalid" && "This reset link is invalid or has expired."}
						{(status === "ready" || status === "saving") &&
							"Choose a new password for your account."}
						{status === "done" && "Redirecting you to your feed…"}
					</p>
				</div>

				{error && (
					<Alert variant="destructive" className="mb-6">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{status === "verifying" && (
					<div className="flex justify-center py-4">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				)}

				{status === "invalid" && (
					<div className="text-center">
						<Link
							href="/forgot-password"
							className="text-primary hover:underline font-medium"
						>
							Request a new reset link
						</Link>
					</div>
				)}

				{(status === "ready" || status === "saving") && (
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="password">New password</Label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								minLength={8}
								autoFocus
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirm">Confirm new password</Label>
							<Input
								id="confirm"
								type="password"
								value={confirm}
								onChange={(e) => setConfirm(e.target.value)}
								required
								minLength={8}
							/>
						</div>

						<Button
							type="submit"
							className="w-full"
							disabled={status === "saving"}
						>
							{status === "saving" && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Update password
						</Button>
					</form>
				)}

				<div className="mt-6 text-center text-sm text-muted-foreground">
					<Link href="/auth" className="text-primary hover:underline font-medium">
						Back to sign in
					</Link>
				</div>
			</div>
		</div>
	);
}
