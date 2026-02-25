'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowRight, Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getStudyGroups, createStudyGroup, joinStudyGroup } from "@/app/academic/actions";
import { useUserUniversity } from "@/hooks/useUserUniversity";

interface StudyGroup {
	id: string;
	name: string;
	description: string;
	memberCount: number;
}

export function StudyCircles() {
	const [groups, setGroups] = useState<StudyGroup[]>([]);
	const [loading, setLoading] = useState(true);
	const { universityId, loading: uniLoading } = useUserUniversity();

	// Create Modal State
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [newGroup, setNewGroup] = useState({ name: "", description: "" });

	// Join State
	const [joiningId, setJoiningId] = useState<string | null>(null);

	const fetchGroups = async () => {
		if (!universityId) return;
		setLoading(true);
		const { success, groups: data, error } = await getStudyGroups(universityId);
		if (success && data) {
			setGroups(data);
		} else {
			console.error(error);
		}
		setLoading(false);
	};

	useEffect(() => {
		if (!uniLoading) fetchGroups();
	}, [universityId, uniLoading]);

	const handleCreate = async () => {
		if (!universityId) return;
		setIsCreating(true);
		const { success, error } = await createStudyGroup({ ...newGroup, universityId });

		if (success) {
			toast.success("Study circle created!");
			setIsCreateOpen(false);
			setNewGroup({ name: "", description: "" });
			fetchGroups();
		} else {
			toast.error(error || "Failed to create group");
		}
		setIsCreating(false);
	};

	const handleJoin = async (id: string, name: string) => {
		setJoiningId(id);
		const { success, error } = await joinStudyGroup(id);
		if (success) {
			toast.success(`Joined ${name}!`);
			fetchGroups();
		} else if (error === "Already a member") {
			toast.info(`You are already in ${name}`);
		} else {
			toast.error(error || "Failed to join");
		}
		setJoiningId(null);
	};

	return (
		<div className="flex flex-col gap-4 p-3">
			<div className="flex items-center justify-between px-1">
				<div className="flex flex-col">
					<p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-0.5">Community</p>
					<h3 className="text-base font-bold tracking-tight">
						Study <span className="text-primary">Circles</span>
					</h3>
				</div>
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border/30 bg-card/60 hover:bg-muted shadow transition-all active:scale-90">
							<Plus className="h-4 w-4 text-primary" />
						</Button>
					</DialogTrigger>
					<DialogContent className="bg-card/90 backdrop-blur-2xl border-border/50 rounded-2xl p-6">
						<DialogHeader>
							<DialogTitle className="text-xl font-bold tracking-tight">Create Study Group</DialogTitle>
							<DialogDescription className="text-sm">Collaborate with fellow students from your university.</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-6">
							<div className="space-y-2">
								<Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Group Name</Label>
								<Input 
									placeholder="e.g. CS101 Advanced Study" 
									className="h-11 rounded-xl bg-card border-border/30 focus:border-primary font-medium"
									value={newGroup.name} 
									onChange={e => setNewGroup({ ...newGroup, name: e.target.value })} 
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
								<Textarea 
									placeholder="What will you study together?" 
									className="rounded-xl bg-card border-border/30 focus:border-primary font-medium min-h-[100px]"
									value={newGroup.description} 
									onChange={e => setNewGroup({ ...newGroup, description: e.target.value })} 
								/>
							</div>
						</div>
						<DialogFooter className="flex-col sm:flex-row gap-2">
							<Button 
								variant="outline" 
								onClick={() => setIsCreateOpen(false)}
								className="h-11 flex-1 rounded-xl font-bold uppercase tracking-wider text-[10px]"
							>
								Cancel
							</Button>
							<Button 
								onClick={handleCreate} 
								disabled={isCreating || !newGroup.name}
								className="h-11 flex-1 rounded-xl bg-primary text-primary-foreground font-bold uppercase tracking-wider text-[10px] shadow-lg shadow-primary/20"
							>
								{isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Create Group"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<div className="space-y-2.5 px-0.5 custom-scrollbar overflow-y-auto pr-1">
				{loading ? (
					<div className="flex flex-col items-center justify-center py-12 gap-3">
						<Loader2 className="h-6 w-6 animate-spin text-primary/40" />
						<p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase animate-pulse">Finding groups...</p>
					</div>
				) : groups.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 gap-3 border border-dashed border-border/30 rounded-2xl opacity-40">
						<Users className="h-6 w-6" />
						<p className="text-[10px] font-bold tracking-wider uppercase">No active groups</p>
					</div>
				) : (
					groups.map(group => (
						<div key={group.id} className="group relative flex flex-col p-3 bg-card/60 backdrop-blur-md rounded-2xl border border-border/30 hover:border-primary/30 transition-all duration-300 shadow hover:shadow-primary/5">
							<div className="flex items-start justify-between mb-2">
								<div className="overflow-hidden">
									<h4 className="font-bold text-sm tracking-tight truncate" title={group.name}>{group.name}</h4>
									<p className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">{group.description || "Study group"}</p>
								</div>
								<div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
									<Users className="h-3.5 w-3.5" />
								</div>
							</div>
							<div className="flex items-center justify-between gap-4 mt-1.5">
								<div className="flex items-center gap-2">
									<div className="flex -space-x-1.5">
										{[1,2,3].map(i => (
											<div key={i} className="h-5 w-5 rounded-full border border-card bg-muted text-[7px] flex items-center justify-center font-bold uppercase opacity-80">U{i}</div>
										))}
									</div>
									<span className="text-[9px] font-bold text-muted-foreground uppercase">{group.memberCount} Members</span>
								</div>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 px-3 rounded-lg bg-primary/10 text-primary border border-primary/20 font-bold uppercase text-[8px] hover:bg-primary hover:text-primary-foreground transition-all"
									onClick={() => handleJoin(group.id, group.name)}
									disabled={joiningId === group.id}
								>
									{joiningId === group.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Join"}
								</Button>
							</div>
						</div>
					))
				)}
			</div>

			<Button 
				variant="outline"
				className="w-full h-11 rounded-xl bg-card border-border/30 font-bold uppercase tracking-wider text-[10px] shadow hover:border-primary/30 transition-colors"
			>
				All Groups
			</Button>
		</div>
	);
}
