'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectCard } from "@/components/research/ProjectCard";
import { Button } from "@/components/ui/button";
import {
	Loader2,
	Plus,
	Microscope,
	Search,
	Filter,
	Sparkles,
	ArrowRight,
	Beaker,
	BrainCircuit,
	BookOpen,
	Globe,
	University,
	Zap,
	ChevronRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Project = {
	id: string;
	title: string;
	description: string;
	status: string;
	createdAt?: string;
	leadId: string;
	scope: "CAMPUS" | "UNIVERSE";
	universityId: string | null;
	lead: {
		fullName: string;
		avatarUrl: string | null;
		department?: string;
	};
};

type CollaboratorRecord = {
	projectId: string;
	role: string;
};

const stats = [
	{ label: "Active Projects", value: "240+", icon: Microscope, color: "text-blue-500", bg: "bg-blue-500/10" },
	{ label: "Total Citations", value: "1.2k", icon: BookOpen, color: "text-violet-500", bg: "bg-violet-500/10" },
	{ label: "Partner Unis", value: "45", icon: Globe, color: "text-emerald-500", bg: "bg-emerald-500/10" },
	{ label: "Researchers", value: "3.5k", icon: BrainCircuit, color: "text-rose-500", bg: "bg-rose-500/10" },
];

export default function ResearchPage() {
	const [activeTab, setActiveTab] = useState<"open" | "my-projects" | "my-applications">("open");
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [applyLoadingProjectId, setApplyLoadingProjectId] = useState<string | null>(null);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [currentUniversityId, setCurrentUniversityId] = useState<string | null>(null);
	const [projects, setProjects] = useState<Project[]>([]);
	const [collaborators, setCollaborators] = useState<CollaboratorRecord[]>([]);
	const [createOpen, setCreateOpen] = useState(false);
	const [form, setForm] = useState({
		title: "",
		description: "",
		status: "OPEN",
		scope: "CAMPUS" as "CAMPUS" | "UNIVERSE"
	});

	const collaboratorMap = useMemo(() => {
		return new Map(collaborators.map((row) => [row.projectId, row.role]));
	}, [collaborators]);

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const { data: authData } = await supabase.auth.getUser();
			const user = authData.user;
			setCurrentUserId(user?.id ?? null);

			if (!user) {
				setProjects([]);
				setCollaborators([]);
				return;
			}

			const [{ data: profile, error: profileError }, { data: projectRows, error: projectError }] = await Promise.all([
				supabase.from("Profile").select("universityId").eq("id", user.id).single(),
				supabase
					.from("ResearchProject")
					.select(`
						id,
						title,
						description,
						status,
						createdAt,
						leadId,
						scope,
						universityId,
						lead:Profile!ResearchProject_leadId_fkey(fullName, avatarUrl, department)
					`)
					.order("createdAt", { ascending: false })
			]);

			if (profileError) throw profileError;
			if (projectError) throw projectError;

			const { data: collaboratorRows, error: collaboratorError } = await supabase
				.from("ProjectCollaborator")
				.select("projectId, role")
				.eq("userId", user.id);

			if (collaboratorError) {
				console.error("Error loading collaborators:", collaboratorError?.message || collaboratorError);
				setCollaborators([]);
			} else {
				setCollaborators((collaboratorRows as CollaboratorRecord[]) ?? []);
			}

			setCurrentUniversityId(profile?.universityId ?? null);
			setProjects((projectRows as unknown as Project[]) ?? []);
		} catch (error: any) {
			console.error("Error loading research hub:", error?.message || error);
			toast.error(error?.message || "Failed to load research projects.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const onCreateProject = async () => {
		if (!currentUserId) {
			toast.error("Please log in to create a project.");
			return;
		}

		if (!form.title.trim() || !form.description.trim()) {
			toast.error("Title and description are required.");
			return;
		}

		setCreating(true);
		try {
			let effectiveUniversityId = currentUniversityId;

			if (!effectiveUniversityId) {
				const { data: profileData, error: profileError } = await supabase
					.from("Profile")
					.select("universityId")
					.eq("id", currentUserId)
					.maybeSingle();

				if (!profileError) {
					effectiveUniversityId = profileData?.universityId ?? null;
					setCurrentUniversityId(effectiveUniversityId);
				}
			}

			if (form.scope === "CAMPUS" && !effectiveUniversityId) {
				toast.error("Campus scope needs a university on your profile. Use Universe scope or update your profile.");
				return;
			}

			const projectId = crypto.randomUUID();
			const collaboratorId = crypto.randomUUID();

			const { error: projectError } = await supabase.from("ResearchProject").insert({
				id: projectId,
				title: form.title.trim(),
				description: form.description.trim(),
				status: form.status,
				scope: form.scope,
				leadId: currentUserId,
				universityId: form.scope === "CAMPUS" ? effectiveUniversityId : (effectiveUniversityId ?? null)
			});

			if (projectError) throw projectError;

			const { error: collaboratorError } = await supabase.from("ProjectCollaborator").insert({
				id: collaboratorId,
				projectId,
				userId: currentUserId,
				role: "LEAD"
			});

			if (collaboratorError) {
				console.error("Error adding lead collaborator:", collaboratorError.message || collaboratorError);
			}

			toast.success("Project created successfully.");
			setCreateOpen(false);
			setForm({ title: "", description: "", status: "OPEN", scope: "CAMPUS" });
			await fetchData();
		} catch (error: any) {
			console.error("Error creating project:", error?.message || error);
			toast.error(error?.message || "Failed to create project.");
		} finally {
			setCreating(false);
		}
	};

	const onApply = async (projectId: string) => {
		if (!currentUserId) {
			toast.error("Please log in to apply.");
			return;
		}

		if (collaboratorMap.has(projectId)) {
			toast.info("You are already associated with this project.");
			return;
		}

		setApplyLoadingProjectId(projectId);
		try {
			const { error } = await supabase.from("ProjectCollaborator").insert({
				id: crypto.randomUUID(),
				projectId,
				userId: currentUserId,
				role: "APPLICANT"
			});

			if (error) throw error;

			setCollaborators((prev) => [...prev, { projectId, role: "APPLICANT" }]);
			toast.success("Application sent successfully.");
		} catch (error: any) {
			console.error("Error applying to project:", error?.message || error);
			toast.error(error?.message || "Failed to apply.");
		} finally {
			setApplyLoadingProjectId(null);
		}
	};

	const openProjects = projects.filter((project) => project.status === "OPEN");
	const myProjects = projects.filter((project) => {
		const role = collaboratorMap.get(project.id);
		return role && role !== "APPLICANT";
	});
	const myApplications = projects.filter((project) => collaboratorMap.get(project.id) === "APPLICANT");

	const filteredProjects = useMemo(() => {
		switch (activeTab) {
			case "open": return openProjects;
			case "my-projects": return myProjects;
			case "my-applications": return myApplications;
			default: return openProjects;
		}
	}, [activeTab, openProjects, myProjects, myApplications]);

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1
			}
		}
	};

	return (
		<DashboardLayout
			title={
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
						<Microscope className="h-6 w-6" />
					</div>
					<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
						Research <span className="text-primary">Hub</span>
					</h1>
				</div>
			}
			subtitle="Collaborate on cutting-edge academic projects across the universe."
			breadcrumb={["UniVerse", "Research"]}
		>
			<div className="max-w-[1400px] mx-auto space-y-8 pb-20 px-8">
				{/* Hero Section */}
				<section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-violet-600 to-indigo-700 p-8 lg:p-10">
					<div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
					<div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
						<div className="space-y-6">
							<motion.div
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20"
							>
								<Sparkles className="h-3.5 w-3.5 text-violet-300" />
								<span className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-100">AI-Powered Research Hub</span>
							</motion.div>

							<div className="space-y-3">
								<motion.h1
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1 }}
									className="text-4xl lg:text-5xl font-black italic tracking-tighter text-white leading-[0.95]"
								>
									EXPLORE THE <br /> FUTURE OF <br />
									<span className="text-violet-300">DISCOVERY.</span>
								</motion.h1>
								<motion.p
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.2 }}
									className="max-w-md text-sm text-violet-100/70 font-medium leading-relaxed"
								>
									Connect with brilliant minds, join ambitious projects, and publish groundbreaking research across the UniVerse.
								</motion.p>
							</div>

							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3 }}
								className="flex flex-wrap gap-3"
							>
								<Dialog open={createOpen} onOpenChange={setCreateOpen}>
									<DialogTrigger asChild>
										<Button size="lg" className="h-14 px-8 rounded-xl bg-white text-violet-600 hover:bg-violet-50 font-black italic tracking-tighter text-base shadow-xl shadow-white/5">
											<Plus className="mr-2 h-5 w-5" /> POST RESEARCH
										</Button>
									</DialogTrigger>
									<DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-2xl border-border/50 rounded-[2rem] p-8">
										<DialogHeader className="mb-6">
											<div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-5">
												<Microscope className="h-6 w-6" />
											</div>
											<DialogTitle className="text-2xl font-black italic tracking-tighter">INITIATE PROJECT</DialogTitle>
											<DialogDescription className="text-xs text-muted-foreground/60 font-medium">
												Define your research parameters and attract top collaborators.
											</DialogDescription>
										</DialogHeader>

										<div className="space-y-5">
											<div className="space-y-2">
												<label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Title</label>
												<Input
													placeholder="What are we exploring?"
													className="h-12 bg-background/50 border-border/50 rounded-xl font-black italic text-base"
													value={form.title}
													onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
												/>
											</div>
											<div className="space-y-2">
												<label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Hypothesis & Methodology</label>
												<Textarea
													placeholder="Describe the scope, goals, and required expertise..."
													className="min-h-[120px] bg-background/50 border-border/50 rounded-xl font-medium p-4 text-sm resize-none"
													value={form.description}
													onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
												/>
											</div>
											<div className="grid grid-cols-2 gap-3">
												<div className="space-y-2">
													<label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Status</label>
													<Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}>
														<SelectTrigger className="h-12 bg-background/50 border-border/50 rounded-xl font-black italic text-sm">
															<SelectValue placeholder="Status" />
														</SelectTrigger>
														<SelectContent className="rounded-xl border-border/50 bg-card/95 backdrop-blur-xl">
															<SelectItem value="OPEN" className="font-black italic">OPEN</SelectItem>
															<SelectItem value="ACTIVE" className="font-black italic">ACTIVE</SelectItem>
															<SelectItem value="CLOSED" className="font-black italic">CLOSED</SelectItem>
														</SelectContent>
													</Select>
												</div>
												<div className="space-y-2">
													<label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Scope</label>
													<Select value={form.scope} onValueChange={(value: "CAMPUS" | "UNIVERSE") => setForm((prev) => ({ ...prev, scope: value }))}>
														<SelectTrigger className="h-12 bg-background/50 border-border/50 rounded-xl font-black italic text-sm">
															<SelectValue placeholder="Scope" />
														</SelectTrigger>
														<SelectContent className="rounded-xl border-border/50 bg-card/95 backdrop-blur-xl">
															<SelectItem value="CAMPUS" className="font-black italic">Campus Only</SelectItem>
															<SelectItem value="UNIVERSE" className="font-black italic">Global Universe</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>
										</div>

										<DialogFooter className="mt-8 sm:justify-between items-center gap-4">
											<Button
												variant="ghost"
												onClick={() => setCreateOpen(false)}
												disabled={creating}
												className="font-black italic uppercase tracking-tighter text-muted-foreground hover:bg-muted text-xs"
											>
												Discard Draft
											</Button>
											<Button
												onClick={onCreateProject}
												disabled={creating}
												className="h-12 px-6 rounded-xl bg-primary text-white font-black italic tracking-tighter shadow-xl shadow-primary/10 text-sm"
											>
												{creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
												INITIALIZE PROJECT
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>

								<Button size="lg" variant="outline" className="h-14 px-6 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 font-black italic tracking-tighter text-base backdrop-blur-md">
									VIEW CITATIONS <ArrowRight className="ml-2 h-4 w-4" />
								</Button>
							</motion.div>
						</div>

						{/* Quick Stats Grid */}
						<div className="grid grid-cols-2 gap-3">
							{stats.map((stat, i) => (
								<motion.div
									key={i}
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ delay: 0.4 + (i * 0.1) }}
									className="p-6 rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10 group hover:bg-white/10 transition-colors duration-500"
								>
									<stat.icon className={cn("h-6 w-6 mb-3 transition-transform group-hover:scale-110 duration-500", stat.color)} />
									<div className="space-y-0.5">
										<p className="text-2xl font-black italic tracking-tighter text-white">{stat.value}</p>
										<p className="text-[9px] font-black uppercase tracking-widest text-violet-100/40">{stat.label}</p>
									</div>
								</motion.div>
							))}
						</div>
					</div>

					{/* Floating particles animation - purely CSS/Tailwind */}
					<div className="absolute top-0 right-0 h-full w-1/3 overflow-hidden pointer-events-none opacity-20">
						<div className="absolute top-1/4 right-1/4 h-2 w-2 bg-white rounded-full animate-ping" />
						<div className="absolute top-1/2 right-1/3 h-1 w-1 bg-white rounded-full animate-pulse delay-700" />
						<div className="absolute bottom-1/4 right-1/2 h-1.5 w-1.5 bg-white rounded-full animate-bounce" />
					</div>
				</section>

				{/* Main Content Area */}
				<div className="space-y-8">
					<div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
						<div className="space-y-6">
							<div className="flex p-1.5 bg-card/40 backdrop-blur-xl border border-border/50 rounded-[1.5rem] w-fit">
								{[
									{ id: "open", label: "Open Access", icon: Globe },
									{ id: "my-projects", label: "My Laboratory", icon: Beaker },
									{ id: "my-applications", label: "Applied", icon: Search },
								].map((tab) => (
									<button
										key={tab.id}
										onClick={() => setActiveTab(tab.id as any)}
										className={cn(
											"relative flex items-center gap-2 px-6 py-3 rounded-2xl transition-all duration-500",
											activeTab === tab.id ? "text-white" : "text-muted-foreground hover:text-foreground"
										)}
									>
										{activeTab === tab.id && (
											<motion.div
												layoutId="activeResearchTab"
												className="absolute inset-0 bg-violet-600 rounded-2xl shadow-xl shadow-violet-600/20"
												transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
											/>
										)}
										<tab.icon className={cn("h-4 w-4 relative z-10", activeTab === tab.id && "text-violet-200")} />
										<span className="text-xs font-black italic tracking-tight relative z-10 uppercase">{tab.label}</span>
									</button>
								))}
							</div>
						</div>

						<div className="flex items-center gap-4">
							<div className="relative group">
								<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
								<Input
									placeholder="Search methodologies..."
									className="w-full md:w-[300px] h-14 pl-12 pr-4 bg-card/40 backdrop-blur-xl border-border/50 rounded-2xl font-medium focus:ring-violet-500/20"
								/>
							</div>
							<Button variant="outline" className="h-14 w-14 rounded-2xl bg-card border-border/50">
								<Filter className="h-5 w-5" />
							</Button>
						</div>
					</div>

					{loading ? (
						<div className="flex flex-col items-center justify-center py-32 gap-4">
							<motion.div
								animate={{ rotate: 360 }}
								transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
								className="p-4 rounded-3xl bg-violet-600/10"
							>
								<Loader2 className="h-12 w-12 text-violet-600 animate-spin" />
							</motion.div>
							<p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Syncing with UniVerse Database...</p>
						</div>
					) : (
						<AnimatePresence mode="wait">
							<motion.div
								key={activeTab}
								variants={containerVariants}
								initial="hidden"
								animate="visible"
								exit={{ opacity: 0, y: 10 }}
								className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8"
							>
								{filteredProjects.length === 0 ? (
									<div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
										<div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
											<Beaker className="h-10 w-10 text-muted-foreground/40" />
										</div>
										<h3 className="text-3xl font-black italic tracking-tighter mb-2 uppercase">Laboratory Empty</h3>
										<p className="text-muted-foreground/60 max-w-sm font-medium">No projects found in this sector. Try expanding your search scope.</p>
										<Button
											variant="outline"
											className="mt-8 rounded-2xl font-black italic"
											onClick={() => setActiveTab('open')}
										>
											RESET SECTOR SCAN
										</Button>
									</div>
								) : (
									filteredProjects.map((project) => (
										<ProjectCard
											key={project.id}
											project={{
												id: project.id,
												title: project.title,
												description: project.description,
												status: project.status,
												lead: {
													fullName: project.lead?.fullName || "Unknown Lead",
													avatarUrl: project.lead?.avatarUrl || null,
													department: project.lead?.department || undefined
												}
											}}
											canApply={currentUserId !== project.leadId}
											hasApplied={collaboratorMap.has(project.id)}
											applying={applyLoadingProjectId === project.id}
											onApply={onApply}
										/>
									))
								)}
							</motion.div>
						</AnimatePresence>
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}
