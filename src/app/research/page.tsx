'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectCard } from "@/components/research/ProjectCard";
import ResearchProjectsCard from "@/components/research/ResearchProjectsCard";
import { Button } from "@/components/ui/button";
import {
	Loader2,
	Plus,
	Microscope,
	Search,
	Beaker,
	Globe,
	Zap,
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

export default function ResearchPage() {
	const [activeTab, setActiveTab] = useState<"open" | "my-projects" | "my-applications" | "manage">("open");
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

	const handleDeleteProject = async (projectId: string) => {
		try {
			// Fixes: "violates foreign key constraint ProjectCollaborator_projectId_fkey"
			const { error: collabError } = await supabase.from("ProjectCollaborator").delete().eq("projectId", projectId);
			if (collabError) throw collabError;

			const { error } = await supabase.from("ResearchProject").delete().eq("id", projectId);

			if (error) throw error;

			setProjects((prev) => prev.filter((p) => p.id !== projectId));
			toast.success("Project deleted successfully.");
		} catch (error: any) {
			console.error("Error deleting project:", error?.message || error);
			toast.error(error?.message || "Failed to delete project.");
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

	// Create Project Dialog
	const createProjectDialog = (
		<Dialog open={createOpen} onOpenChange={setCreateOpen}>
			<DialogTrigger asChild>
				<Button className="gap-2">
					<Plus className="h-4 w-4" />
					New Project
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-2xl border-border/50 rounded-2xl p-6">
				<DialogHeader className="mb-4">
					<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
						<Microscope className="h-5 w-5" />
					</div>
					<DialogTitle className="text-xl font-bold">Create Research Project</DialogTitle>
					<DialogDescription className="text-sm text-muted-foreground">
						Define your research parameters and attract top collaborators.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<label className="text-xs font-medium text-muted-foreground">Title</label>
						<Input
							placeholder="What are we exploring?"
							className="h-10 bg-background/50 border-border/50 rounded-lg"
							value={form.title}
							onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
						/>
					</div>
					<div className="space-y-2">
						<label className="text-xs font-medium text-muted-foreground">Description</label>
						<Textarea
							placeholder="Describe the scope, goals, and required expertise..."
							className="min-h-[100px] bg-background/50 border-border/50 rounded-lg text-sm resize-none"
							value={form.description}
							onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<label className="text-xs font-medium text-muted-foreground">Status</label>
							<Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}>
								<SelectTrigger className="h-10 bg-background/50 border-border/50 rounded-lg text-sm">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent className="rounded-lg border-border/50 bg-card/95 backdrop-blur-xl">
									<SelectItem value="OPEN">Open</SelectItem>
									<SelectItem value="ACTIVE">Active</SelectItem>
									<SelectItem value="CLOSED">Closed</SelectItem>
								</SelectContent>
							</Select>
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
						onClick={onCreateProject}
						disabled={creating}
						className="gap-2"
					>
						{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
						Create Project
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
						<Microscope className="h-6 w-6" />
					</div>
					<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
						Research <span className="text-primary">Hub</span>
					</h1>
				</div>
			}
			subtitle="Collaborate on cutting-edge academic projects across the universe."
			breadcrumb={["UniVerse", "Research"]}
			action={createProjectDialog}
		>
			<div className="space-y-6">
				{/* Controls Row */}
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					{/* Tab Switcher */}
					<div className="inline-flex p-1 bg-muted/50 rounded-xl border border-border/50">
						{[
								{ id: "open", label: "Open Projects", icon: Globe },
								{ id: "my-projects", label: "My Projects", icon: Beaker },
								{ id: "my-applications", label: "Applied", icon: Search },
								// Manage tab will be rendered conditionally below
							].map((tab) => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id as any)}
								className={cn(
									"relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
									activeTab === tab.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
								)}
							>
								{activeTab === tab.id && (
									<motion.div
										layoutId="researchTab"
										className="absolute inset-0 bg-primary rounded-lg shadow-md"
										transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
									/>
								)}
								<tab.icon className="h-4 w-4 relative z-10" />
								<span className="relative z-10 hidden sm:inline">{tab.label}</span>
							</button>
						))}
						{Array.from(collaboratorMap.values()).some((r) => r === "LEAD") ? (
							<button
								onClick={() => setActiveTab('manage')}
								className={cn(
									"relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
									activeTab === 'manage' ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
								)}
							>
								{activeTab === 'manage' && (
									<motion.div
										layoutId="researchTab"
										className="absolute inset-0 bg-primary rounded-lg shadow-md"
										transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
									/>
								)}
								<Zap className="h-4 w-4 relative z-10" />
								<span className="relative z-10 hidden sm:inline">Manage Projects</span>
							</button>
						) : null}
					</div>

					{/* Search */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search projects..."
							className="w-full sm:w-[250px] h-9 pl-9 bg-muted/50 border-border/50 rounded-lg"
						/>
					</div>
				</div>

				{/* Content */}
				{loading ? (
					<div className="flex flex-col items-center justify-center py-20 gap-3">
						<Loader2 className="h-8 w-8 text-primary animate-spin" />
						<p className="text-sm text-muted-foreground">Loading research projects...</p>
					</div>
				) : (
					<AnimatePresence mode="wait">
						<motion.div
							key={activeTab}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.2 }}
							className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
						>
							{activeTab === 'manage' ? (
								<div className="col-span-full">
									<ResearchProjectsCard canManage={(id) => collaboratorMap.get(id) === "LEAD"} onChange={fetchData} />
								</div>
							) : filteredProjects.length === 0 ? (
								<div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
									<div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
										<Beaker className="h-8 w-8 text-muted-foreground/40" />
									</div>
									<h3 className="text-xl font-bold mb-2">No Projects Found</h3>
									<p className="text-muted-foreground text-sm max-w-sm">No projects found in this category. Try switching tabs or create a new project.</p>
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
										onDelete={handleDeleteProject}
									/>
								))
							)}
						</motion.div>
					</AnimatePresence>
				)}
			</div>
		</DashboardLayout>
	);
}
