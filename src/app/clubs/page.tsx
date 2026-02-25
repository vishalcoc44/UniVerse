'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClubGrid } from "@/components/clubs/ClubGrid";
import { useState } from "react";
import { Globe2, School, Trophy, Plus, Loader2, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function ClubsPage() {
	const [scope, setScope] = useState<'campus' | 'universe'>('campus');
	const [createOpen, setCreateOpen] = useState(false);
	const [creating, setCreating] = useState(false);
	const [form, setForm] = useState({
		name: "",
		description: "",
		category: "",
		scope: "CAMPUS" as "CAMPUS" | "UNIVERSE"
	});

	const onCreateClub = async () => {
		const { data: { user } } = await supabase.auth.getUser();

		if (!user) {
			toast.error("Please log in to create a club.");
			return;
		}

		if (!form.name.trim() || !form.description.trim() || !form.category.trim()) {
			toast.error("Name, description, and category are required.");
			return;
		}

		setCreating(true);
		try {
			// Get user university
			const { data: profileData, error: profileError } = await supabase
				.from("Profile")
				.select("universityId")
				.eq("id", user.id)
				.maybeSingle();

			const userUniversityId = profileData?.universityId || null;

			if (form.scope === "CAMPUS" && !userUniversityId) {
				toast.error("Campus scope needs a university on your profile.");
				setCreating(false);
				return;
			}

			const clubId = crypto.randomUUID();

			const { error: clubError } = await supabase.from("Club").insert({
				id: clubId,
				name: form.name.trim(),
				description: `[${form.category.trim()}] ${form.description.trim()}`,
				scope: form.scope,
				ownerId: user.id,
				universityId: form.scope === "CAMPUS" ? userUniversityId : null
			});

			if (clubError) throw clubError;

			// Add as OWNER
			const { error: memberError } = await supabase.from("ClubMember").insert({
				id: crypto.randomUUID(),
				clubId,
				userId: user.id,
				role: "OWNER"
			});

			if (memberError) {
				console.error("Error adding owner member:", memberError.message);
			}

			toast.success("Club created successfully.");
			setCreateOpen(false);
			setForm({ name: "", description: "", category: "", scope: "CAMPUS" });

			// Force reload to pick up new club
			window.location.reload();
		} catch (error: any) {
			toast.error(error?.message || "Failed to create club.");
		} finally {
			setCreating(false);
		}
	};

	const createClubDialog = (
		<Dialog open={createOpen} onOpenChange={setCreateOpen}>
			<DialogTrigger asChild>
				<Button className="gap-2">
					<Plus className="h-4 w-4" />
					New Club
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-2xl border-border/50 rounded-2xl p-6">
				<DialogHeader className="mb-4">
					<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
						<Trophy className="h-5 w-5" />
					</div>
					<DialogTitle className="text-xl font-bold">Create Club</DialogTitle>
					<DialogDescription className="text-sm text-muted-foreground">
						Start a new community and gather people around your shared interests.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<label className="text-xs font-medium text-muted-foreground">Club Name</label>
						<Input
							placeholder="e.g. Quantum Computing Society"
							className="h-10 bg-background/50 border-border/50 rounded-lg"
							value={form.name}
							onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
						/>
					</div>
					<div className="space-y-2">
						<label className="text-xs font-medium text-muted-foreground">Description</label>
						<Textarea
							placeholder="What is this club about?"
							className="min-h-[100px] bg-background/50 border-border/50 rounded-lg text-sm resize-none"
							value={form.description}
							onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<label className="text-xs font-medium text-muted-foreground">Category</label>
							<Input
								placeholder="e.g. Technology, Art, Sports..."
								className="h-10 bg-background/50 border-border/50 rounded-lg text-sm"
								value={form.category}
								onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
							/>
						</div>
						<div className="space-y-2">
							<label className="text-xs font-medium text-muted-foreground">Scope</label>
							<Select value={form.scope} onValueChange={(value: "CAMPUS" | "UNIVERSE") => setForm((prev) => ({ ...prev, scope: value }))}>
								<SelectTrigger className="h-10 bg-background/50 border-border/50 rounded-lg text-sm">
									<SelectValue placeholder="Scope" />
								</SelectTrigger>
								<SelectContent className="rounded-lg border-border/50 bg-card/95 backdrop-blur-xl">
									<SelectItem value="CAMPUS">Campus Only</SelectItem>
									<SelectItem value="UNIVERSE">Global Universe</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				<DialogFooter className="mt-6 gap-3">
					<Button
						variant="ghost"
						onClick={() => setCreateOpen(false)}
						disabled={creating}
						className="text-muted-foreground"
					>
						Cancel
					</Button>
					<Button
						onClick={onCreateClub}
						disabled={creating}
						className="gap-2"
					>
						{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
						Create Club
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);

	return (
		<DashboardLayout
			title={
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
						<Trophy className="h-6 w-6" />
					</div>
					<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
						Clubs & <span className="text-primary">Societies</span>
					</h1>
				</div>
			}
			subtitle="Find student-run clubs and connect with others who share your interests."
			breadcrumb={["UniVerse", "Clubs"]}
			action={createClubDialog}
		>
			<div className="space-y-6">
				{/* Scope Switcher */}
				<div className="flex items-center justify-between">
					<div className="inline-flex p-1 bg-muted/50 rounded-xl border border-border/50">
						{[
							{ id: "campus", label: "On Campus", icon: School },
							{ id: "universe", label: "Across Universities", icon: Globe2 }
						].map((s) => (
							<button
								key={s.id}
								onClick={() => setScope(s.id as any)}
								className={cn(
									"relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
									scope === s.id
										? "text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								{scope === s.id && (
									<motion.div
										layoutId="clubScope"
										className="absolute inset-0 bg-primary rounded-lg shadow-md"
										transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
									/>
								)}
								<s.icon className="h-4 w-4 relative z-10" />
								<span className="relative z-10">{s.label}</span>
							</button>
						))}
					</div>
				</div>

				{/* Club Grid */}
				<ClubGrid scope={scope} />
			</div>
		</DashboardLayout>
	);
}
