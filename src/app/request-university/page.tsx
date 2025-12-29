'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Check, AlertCircle, ArrowLeft } from "lucide-react";

export default function RequestUniversity() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Form State
	const [formData, setFormData] = useState({
		name: "",
		abbreviation: "",
		location: "", // City, Country
		website: "",
		domains: "", // Comma separated
		logoUrl: "",
		adminName: "",
		adminEmail: "",
		adminPhone: ""
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setFormData({ ...formData, [e.target.id]: e.target.value });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		// Basic Validation
		if (!formData.name || !formData.location || !formData.website || !formData.domains || !formData.adminEmail) {
			setError("Please fill in all required fields.");
			setLoading(false);
			return;
		}

		// Parse domains
		const domainList = formData.domains.split(',').map(d => d.trim()).filter(d => d.length > 0);

		try {
			const { error: insertError } = await supabase
				.from('University')
				.insert({
					name: formData.name,
					abbreviation: formData.abbreviation,
					location: formData.location,
					website: formData.website,
					domains: domainList,
					logoUrl: formData.logoUrl,
					status: 'PENDING',
					adminName: formData.adminName,
					adminEmail: formData.adminEmail,
					adminPhone: formData.adminPhone
				});

			if (insertError) {
				if (insertError.code === '23505') { // Unique violation
					throw new Error("A university with this name already exists.");
				}
				throw insertError;
			}

			setSuccess(true);
		} catch (err: any) {
			setError(err.message || "Failed to submit request.");
		} finally {
			setLoading(false);
		}
	};

	if (success) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
				<div className="w-full max-w-md bg-card p-8 rounded-xl shadow-lg border border-border text-center">
					<div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
						<Check className="h-6 w-6 text-green-600" />
					</div>
					<h2 className="text-2xl font-bold mb-2">Request Submitted!</h2>
					<p className="text-muted-foreground mb-6">
						Thank you for submitting {formData.name}. Our team will review your request and verify the details. You will receive an update at <strong>{formData.adminEmail}</strong> once approved.
					</p>
					<Link href="/">
						<Button variant="outline">Back to Home</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-muted/20 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-2xl mx-auto">
				<div className="mb-8">
					<Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
						<ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
					</Link>
					<h1 className="text-3xl font-bold text-foreground">Add Your University</h1>
					<p className="text-muted-foreground mt-2">
						Help us expand! Submit your university details for verification. Once approved, students with your university email domain will be able to join.
					</p>
				</div>

				<div className="bg-card shadow rounded-xl border border-border overflow-hidden">
					<div className="p-6 sm:p-8">
						{error && (
							<Alert variant="destructive" className="mb-6">
								<AlertCircle className="h-4 w-4" />
								<AlertTitle>Error</AlertTitle>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<form onSubmit={handleSubmit} className="space-y-8">

							{/* University Details */}
							<div className="space-y-4">
								<h3 className="text-lg font-medium">University Details</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="name">University Name *</Label>
										<Input id="name" placeholder="e.g. Dayananda Sagar University" value={formData.name} onChange={handleChange} required />
									</div>
									<div className="space-y-2">
										<Label htmlFor="abbreviation">Abbreviation</Label>
										<Input id="abbreviation" placeholder="e.g. DSU" value={formData.abbreviation} onChange={handleChange} />
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="location">Location (City, Country) *</Label>
									<Input id="location" placeholder="e.g. Bangalore, India" value={formData.location} onChange={handleChange} required />
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="website">Website Domain *</Label>
										<Input id="website" placeholder="e.g. dsu.edu.in" value={formData.website} onChange={handleChange} required />
									</div>
									<div className="space-y-2">
										<Label htmlFor="logoUrl">Logo URL (Optional)</Label>
										<Input id="logoUrl" placeholder="https://..." value={formData.logoUrl} onChange={handleChange} />
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="domains">Student Email Domains (comma separated) *</Label>
									<Input id="domains" placeholder="e.g. dsu.edu.in, student.dsu.edu" value={formData.domains} onChange={handleChange} required />
									<p className="text-xs text-muted-foreground">Only students with emails ending in these domains will be able to sign up.</p>
								</div>
							</div>

							<div className="h-px bg-border" />

							{/* Requestor Details */}
							<div className="space-y-4">
								<h3 className="text-lg font-medium">Your Contact Details</h3>
								<p className="text-sm text-muted-foreground">We may contact you for verification purposes.</p>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="adminName">Full Name *</Label>
										<Input id="adminName" placeholder="Your Name" value={formData.adminName} onChange={handleChange} required />
									</div>
									<div className="space-y-2">
										<Label htmlFor="adminPhone">Phone Number</Label>
										<Input id="adminPhone" type="tel" placeholder="+91..." value={formData.adminPhone} onChange={handleChange} />
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="adminEmail">Email Address *</Label>
									<Input id="adminEmail" type="email" placeholder="you@university.edu" value={formData.adminEmail} onChange={handleChange} required />
								</div>
							</div>

							<Button type="submit" className="w-full" size="lg" disabled={loading}>
								{loading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
									</>
								) : (
									"Submit Request"
								)}
							</Button>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
}
