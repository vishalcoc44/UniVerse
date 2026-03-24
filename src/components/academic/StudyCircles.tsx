'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ArrowRight, Plus, Loader2, Sparkles, Brain } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getStudyGroups, createStudyGroup, joinStudyGroup, getRecommendedStudyGroups } from "@/app/academic/actions";
import { useUserUniversity } from "@/hooks/useUserUniversity";
import { GroupDetails } from "./GroupDetails";

interface StudyGroup {
	id: string;
	name: string;
	description: string;
	memberCount: number;
}

export function StudyCircles() {
	const [groups, setGroups] = useState<StudyGroup[]>([]);
	const [recommendedGroups, setRecommendedGroups] = useState<StudyGroup[]>([]);
	const [loading, setLoading] = useState(true);
	const { universityId, loading: uniLoading, userId } = useUserUniversity();

	// Create Modal State
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [newGroup, setNewGroup] = useState({ name: "", description: "" });

	// Join State
	const [joiningId, setJoiningId] = useState<string | null>(null);

	// Navigation State
	const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);

	const fetchGroups = async () => {
		if (!universityId) return;
		setLoading(true);

		const allGroupsPromise = getStudyGroups(universityId);
		const recommendedPromise = getRecommendedStudyGroups(universityId);

		const [allResult, recResult] = await Promise.all([allGroupsPromise, recommendedPromise]);

		if (allResult.success && allResult.groups) {
			setGroups(allResult.groups);
		}

		if (recResult.success && recResult.recommendations) {
			setRecommendedGroups(recResult.recommendations);
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

	const renderGroupCard = (group: StudyGroup) => (
		<div key={group.id} className="group relative flex flex-col p-4 bg-background/40 backdrop-blur-xl rounded-[1.5rem] border border-border/20 hover:border-primary/40 transition-all duration-500 shadow-xl hover:shadow-primary/5 group/card overflow-hidden">
			<div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
			<div className="flex items-start justify-between mb-4 relative z-10">
				<div className="overflow-hidden">
					<h4 className="font-black text-sm tracking-tight truncate uppercase mb-1" title={group.name}>{group.name}</h4>
					<p className="text-[10px] text-muted-foreground font-bold truncate tracking-wide">{group.description || "Active Research Circle"}</p>
				</div>
				<div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0 group-hover/card:scale-110 transition-transform shadow-lg shadow-primary/5">
					<Users className="h-4 w-4" />
				</div>
			</div>
			<div className="flex items-center justify-between gap-4 mt-2 relative z-10">
				<div className="flex items-center gap-3">
					<div className="flex -space-x-2">
						{[1, 2, 3].map(i => (
							<div key={i} className="h-6 w-6 rounded-full border-2 border-background bg-muted text-[8px] flex items-center justify-center font-black uppercase text-muted-foreground">U{i}</div>
						))}
					</div>
					<span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{group.memberCount} Mems</span>
				</div>
				<Button
					variant="ghost"
					size="sm"
					className="h-9 px-4 rounded-xl bg-primary/10 text-primary border border-primary/20 font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all active:scale-95 shadow-lg shadow-primary/5"
					onClick={(e) => {
						e.stopPropagation();
						// If already joined (this logic needs to check membership, but for now we'll allow Open or Join)
						// For the sake of "wow" factor, let's make it smarter
						if (group.memberCount > 0) {
							setSelectedGroup(group);
						} else {
							handleJoin(group.id, group.name);
						}
					}}
					disabled={joiningId === group.id}
				>
					{joiningId === group.id ? <Loader2 className="h-3 w-3 animate-spin" /> : group.memberCount > 0 ? "Open Circle" : "Infiltrate"}
				</Button>
			</div>
		</div>
	);

	return (
		<div className="flex flex-col gap-6 p-4">
			<AnimatePresence mode="wait">
				{selectedGroup ? (
					<motion.div
						key="details"
						initial={{ opacity: 0, x: 50 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -50 }}
						transition={{ duration: 0.4 }}
						className="min-h-[500px]"
					>
						<GroupDetails 
							group={selectedGroup} 
							onBack={() => setSelectedGroup(null)} 
							userId={userId || undefined}
						/>
					</motion.div>
				) : (
					<motion.div
						key="list"
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 1.05 }}
						transition={{ duration: 0.4 }}
						className="flex flex-col gap-6"
					>
						<div className="flex items-center justify-between px-2">
							<div className="flex flex-col gap-1">
								<p className="text-[11px] font-black tracking-[0.2em] text-primary uppercase mb-0.5">Community Mesh</p>
								<h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
									Research <span className="text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.3)]">Circles</span>
								</h3>
							</div>
							<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
								<DialogTrigger asChild>
									<Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl border-primary/20 bg-primary/5 hover:bg-primary/20 shadow-xl transition-all active:scale-90 group">
										<Plus className="h-5 w-5 text-primary group-hover:rotate-90 transition-transform" />
									</Button>
								</DialogTrigger>
								<DialogContent className="bg-background/90 backdrop-blur-3xl border-primary/20 rounded-[2rem] p-8 shadow-2xl">
									<DialogHeader>
										<DialogTitle className="text-3xl font-black tracking-tighter">INITIATE CIRCLE</DialogTitle>
										<DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Spawn a new collaborative research node.</DialogDescription>
									</DialogHeader>
									<div className="space-y-6 py-8">
										<div className="space-y-2.5">
											<Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 ml-1">Codename / Title</Label>
											<Input
												placeholder="e.g. PROJECT_OMEGA"
												className="h-12 rounded-2xl bg-muted/20 border-border/20 focus:border-primary font-bold uppercase tracking-wider px-5"
												value={newGroup.name}
												onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
											/>
										</div>
										<div className="space-y-2.5">
											<Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 ml-1">Mission Intel</Label>
											<Textarea
												placeholder="Describe the research objective..."
												className="rounded-2xl bg-muted/20 border-border/20 focus:border-primary font-medium min-h-[120px] px-5 py-4"
												value={newGroup.description}
												onChange={e => setNewGroup({ ...newGroup, description: e.target.value })}
											/>
										</div>
									</div>
									<DialogFooter className="flex-col sm:flex-row gap-3">
										<Button
											variant="ghost"
											onClick={() => setIsCreateOpen(false)}
											className="h-12 flex-1 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-muted/30"
										>
											Abort
										</Button>
										<Button
											onClick={handleCreate}
											disabled={isCreating || !newGroup.name}
											className="h-12 flex-1 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20"
										>
											{isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Deploy Circle"}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>

						<Tabs defaultValue="all" className="w-full flex-1 flex flex-col min-h-0">
							<TabsList className="w-full grid grid-cols-2 bg-muted/30 p-1.5 rounded-2xl mb-6 border border-border/10">
								<TabsTrigger value="all" className="text-[10px] font-black uppercase tracking-[0.1em] rounded-xl py-2.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-xl transition-all duration-300">All Nodes</TabsTrigger>
								<TabsTrigger value="recommended" className="text-[10px] font-black uppercase tracking-[0.1em] rounded-xl py-2.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-xl transition-all duration-300 flex items-center gap-2">
									<Sparkles className="h-3.5 w-3.5" /> Neural Match
								</TabsTrigger>
							</TabsList>

							<TabsContent value="all" className="space-y-4 px-0.5 custom-scrollbar overflow-y-auto pr-2 flex-1 mt-0">
								{loading ? (
									<div className="flex flex-col items-center justify-center py-20 gap-4">
										<div className="relative">
											<Loader2 className="h-10 w-10 animate-spin text-primary/40" />
											<Brain className="h-4 w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/60" />
										</div>
										<p className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase animate-pulse">Syncing Network...</p>
									</div>
								) : groups.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-20 gap-4 border-2 border-dashed border-border/20 rounded-[2rem] opacity-30">
										<Users className="h-10 w-10" />
										<p className="text-[10px] font-black tracking-[0.2em] uppercase">No Nodes Detected</p>
									</div>
								) : (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{groups.map(group => renderGroupCard(group))}
									</div>
								)}
							</TabsContent>

							<TabsContent value="recommended" className="space-y-4 px-0.5 custom-scrollbar overflow-y-auto pr-2 flex-1 mt-0">
								{loading ? (
									<div className="flex flex-col items-center justify-center py-20 gap-4">
										<Loader2 className="h-10 w-10 animate-spin text-primary/40" />
										<p className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase animate-pulse">Analyzing Synapses...</p>
									</div>
								) : recommendedGroups.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-20 gap-5 border-2 border-dashed border-border/20 rounded-[2rem] opacity-40 text-center px-8">
										<Sparkles className="h-10 w-10 mb-2 text-primary/40" />
										<p className="text-[10px] font-black tracking-[0.2em] uppercase text-primary">Neural Profile Incomplete</p>
										<p className="text-xs text-muted-foreground font-medium max-w-[200px]">Update your academic bio for smart node matches.</p>
									</div>
								) : (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{recommendedGroups.map(group => renderGroupCard(group))}
									</div>
								)}
							</TabsContent>
						</Tabs>

						<Button
							variant="ghost"
							className="w-full h-14 rounded-2xl bg-card/40 border border-border/20 font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-primary/5 hover:border-primary/40 transition-all duration-500 overflow-hidden relative group"
						>
							<div className="absolute inset-x-0 bottom-0 h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
							Browse Global Network
						</Button>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
